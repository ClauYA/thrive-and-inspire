import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { marked } from "marked";
import { dbEnabled, query, pool } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" })); // posts can carry sizeable Markdown

// ── Email transport (optional) ──
// Applications are emailed to the coach if email is configured; otherwise they
// are still stored to disk so nothing is ever lost during local dev.
//
// Two ways to configure (Gmail is the simplest):
//   1. Gmail:  set GMAIL_USER + GMAIL_APP_PASSWORD (a 16-char App Password,
//              NOT your normal password — requires 2-Step Verification on).
//   2. Generic SMTP: set SMTP_HOST + SMTP_USER + SMTP_PASS (+ optional SMTP_PORT).
let transporter = null;
let mailFrom = null;

if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      // App Passwords are shown with spaces ("abcd efgh ijkl mnop"); strip them.
      pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, ""),
    },
  });
  mailFrom = process.env.GMAIL_USER;
} else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  mailFrom = process.env.SMTP_USER;
}

// Where applications are emailed (falls back to the sending account).
const APPLY_TO = process.env.APPLY_TO || mailFrom;

// Booking link sent to applicants in the auto-reply (override via env var).
const CALENDLY_URL = process.env.CALENDLY_URL || "https://calendly.com/cyabittner/30min";

// Builds the friendly auto-reply we send to an applicant, in their language,
// inviting them to book the discovery call via Calendly.
function applicantAutoReply(firstName, lang) {
  const es = lang !== "en";
  const subject = es
    ? `¡Gracias por aplicar, ${firstName}! Agenda tu llamada 🌿`
    : `Thanks for applying, ${firstName}! Let's book your call 🌿`;
  const intro = es
    ? `¡Hola ${firstName}! Gracias por dar el primer paso. Recibí tu aplicación y me encantaría conocerte.`
    : `Hi ${firstName}! Thank you for taking the first step. I received your application and I'd love to get to know you.`;
  const cta = es
    ? "El siguiente paso es agendar tu llamada de descubrimiento (gratis, sin compromiso). Elige el horario que mejor te quede aquí:"
    : "The next step is to book your free, no-pressure discovery call. Pick the time that works best for you here:";
  const button = es ? "Agendar mi llamada →" : "Book my call →";
  const closing = es
    ? "Nos vemos pronto. ¡Estoy muy emocionada de acompañarte!"
    : "Talk soon — I'm so excited to support you!";
  const signature = es ? "Con cariño,<br>Claudia · Lift & Inspire" : "Warmly,<br>Claudia · Lift & Inspire";

  const text = `${intro}\n\n${cta}\n${CALENDLY_URL}\n\n${closing}\n\n${es ? "Con cariño, Claudia · Lift & Inspire" : "Warmly, Claudia · Lift & Inspire"}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;color:#2c2c2a;line-height:1.6">
      <h2 style="color:#b07d1f;margin:0 0 16px">${es ? "¡Gracias por aplicar!" : "Thanks for applying!"}</h2>
      <p style="margin:0 0 16px">${intro}</p>
      <p style="margin:0 0 20px">${cta}</p>
      <p style="margin:0 0 28px">
        <a href="${CALENDLY_URL}" style="background:#b07d1f;color:#fff;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:999px;display:inline-block">${button}</a>
      </p>
      <p style="margin:0 0 16px">${closing}</p>
      <p style="margin:0;color:#6b6560">${signature}</p>
    </div>`;
  return { subject, text, html };
}

// Where applications are appended when email isn't configured.
const SUBMISSIONS_FILE = path.join(__dirname, "submissions.jsonl");

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Application endpoint ──
app.post("/api/apply", async (req, res) => {
  const { firstName, lastName, email, goal, obstacles, findUs, lang } = req.body || {};

  if (!firstName || !String(firstName).trim() || !isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: "Name and a valid email are required." });
  }

  const submission = {
    firstName: String(firstName).trim(),
    lastName: String(lastName || "").trim(),
    email: String(email).trim(),
    goal: String(goal || "").trim(),
    obstacles: String(obstacles || "").trim(),
    findUs: String(findUs || "").trim(),
    receivedAt: new Date().toISOString(),
  };

  // Persist to the database when configured (best-effort).
  if (dbEnabled) {
    try {
      await query(
        `insert into applications (first_name, last_name, email, goal, obstacles, find_us)
         values ($1, $2, $3, $4, $5, $6)`,
        [submission.firstName, submission.lastName, submission.email, submission.goal, submission.obstacles, submission.findUs]
      );
    } catch (err) {
      console.error("DB insert (application) failed:", err);
    }
  }

  // Always persist to disk as a durable record.
  try {
    fs.appendFileSync(SUBMISSIONS_FILE, JSON.stringify(submission) + "\n");
  } catch (err) {
    console.error("Failed to write submission:", err);
  }

  // Email the coach if a transport is configured.
  if (transporter) {
    const fullName = `${submission.firstName} ${submission.lastName}`.trim();
    const rows = [
      ["Name", fullName],
      ["Email", submission.email],
      ["Goal", submission.goal || "—"],
      ["Obstacles", submission.obstacles || "—"],
      ["Heard about us via", submission.findUs || "—"],
      ["Received", submission.receivedAt],
    ];
    try {
      await transporter.sendMail({
        from: `"Lift & Inspire" <${mailFrom}>`,
        to: APPLY_TO,
        replyTo: submission.email, // hitting reply goes straight to the applicant
        subject: `New coaching application — ${fullName}`,
        text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#2c2c2a">
            <h2 style="color:#c4714a;margin:0 0 4px">New coaching application</h2>
            <p style="color:#6b6560;margin:0 0 20px">A new applicant just submitted the form.</p>
            <table style="width:100%;border-collapse:collapse">
              ${rows
                .map(
                  ([k, v]) =>
                    `<tr><td style="padding:8px 12px;background:#faf7f2;border:1px solid #e8ddd0;font-weight:bold;width:160px">${k}</td><td style="padding:8px 12px;border:1px solid #e8ddd0">${v}</td></tr>`
                )
                .join("")}
            </table>
          </div>`,
      });
      console.log("✉️  Application emailed for:", submission.email);
    } catch (err) {
      console.error("Failed to send email:", err);
      // Submission is already saved, so still report success to the user.
    }

    // Auto-reply to the applicant with the Calendly booking link.
    try {
      const reply = applicantAutoReply(submission.firstName, lang);
      await transporter.sendMail({
        from: `"Lift & Inspire" <${mailFrom}>`,
        to: submission.email,
        replyTo: APPLY_TO, // replies from the applicant reach the coach
        subject: reply.subject,
        text: reply.text,
        html: reply.html,
      });
      console.log("✉️  Auto-reply (Calendly) sent to:", submission.email);
    } catch (err) {
      console.error("Failed to send auto-reply:", err);
    }
  } else {
    console.log("📥 New application stored:", submission.email);
  }

  res.json({ ok: true });
});

// ── Coaching intake endpoint ──
// The full intake form (goals, measurements, history) for clients ready to
// start. Payment itself happens via the Stripe / Venmo links on the page.
app.post("/api/ready", async (req, res) => {
  const { firstName, lastName, email, phone, goals, format, location, weight, height, coachedBefore, experience, message } = req.body || {};

  if (!firstName || !String(firstName).trim() || !isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: "Name and a valid email are required." });
  }

  const goalsList = Array.isArray(goals) ? goals.map((g) => String(g).trim()).filter(Boolean) : [];

  const submission = {
    type: "intake",
    firstName: String(firstName).trim(),
    lastName: String(lastName || "").trim(),
    email: String(email).trim(),
    phone: String(phone || "").trim(),
    goals: goalsList,
    format: String(format || "").trim(),
    location: String(location || "").trim(),
    weight: String(weight || "").trim(),
    height: String(height || "").trim(),
    coachedBefore: String(coachedBefore || "").trim(),
    experience: String(experience || "").trim(),
    message: String(message || "").trim(),
    receivedAt: new Date().toISOString(),
  };

  // Persist to the database when configured (best-effort).
  if (dbEnabled) {
    try {
      await query(
        `insert into intakes (first_name, last_name, email, phone, goals, format, location, weight, height, coached_before, experience, message)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [submission.firstName, submission.lastName, submission.email, submission.phone, submission.goals, submission.format, submission.location, submission.weight, submission.height, submission.coachedBefore, submission.experience, submission.message]
      );
    } catch (err) {
      console.error("DB insert (intake) failed:", err);
    }
  }

  // Always persist to disk as a durable record.
  try {
    fs.appendFileSync(SUBMISSIONS_FILE, JSON.stringify(submission) + "\n");
  } catch (err) {
    console.error("Failed to write submission:", err);
  }

  // Email the coach if a transport is configured.
  if (transporter) {
    const fullName = `${submission.firstName} ${submission.lastName}`.trim();
    const rows = [
      ["Name", fullName],
      ["Email", submission.email],
      ["Phone", submission.phone || "—"],
      ["Goals", submission.goals.join(", ") || "—"],
      ["Coaching format", submission.format || "—"],
      ["City / area", submission.location || "—"],
      ["Weight", submission.weight || "—"],
      ["Height", submission.height || "—"],
      ["Coached before", submission.coachedBefore || "—"],
      ["Experience", submission.experience || "—"],
      ["Message", submission.message || "—"],
      ["Received", submission.receivedAt],
    ];
    try {
      await transporter.sendMail({
        from: `"Lift & Inspire" <${mailFrom}>`,
        to: APPLY_TO,
        replyTo: submission.email,
        subject: `New coaching intake — ${fullName}`,
        text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#2c2c2a">
            <h2 style="color:#2c5d5d;margin:0 0 4px">New coaching intake 🎉</h2>
            <p style="color:#6b6560;margin:0 0 20px">A client just submitted their intake form.</p>
            <table style="width:100%;border-collapse:collapse">
              ${rows
                .map(
                  ([k, v]) =>
                    `<tr><td style="padding:8px 12px;background:#f4f6f2;border:1px solid #dde3da;font-weight:bold;width:160px">${k}</td><td style="padding:8px 12px;border:1px solid #dde3da">${v}</td></tr>`
                )
                .join("")}
            </table>
          </div>`,
      });
      console.log("✉️  Intake emailed for:", submission.email);
    } catch (err) {
      console.error("Failed to send email:", err);
    }
  } else {
    console.log("📥 New intake stored:", submission.email);
  }

  res.json({ ok: true });
});

// ── Free guide lead capture (email popup) ──
// Collects name + email from the "Get your FREE Guide" popup. Stored to disk
// and emailed to the coach so leads are never lost.
app.post("/api/guide", async (req, res) => {
  const { firstName, email } = req.body || {};

  if (!firstName || !String(firstName).trim() || !isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: "Name and a valid email are required." });
  }

  const submission = {
    type: "guide-lead",
    firstName: String(firstName).trim(),
    email: String(email).trim(),
    receivedAt: new Date().toISOString(),
  };

  // Persist to the database when configured (best-effort).
  if (dbEnabled) {
    try {
      await query(
        `insert into guide_leads (first_name, email) values ($1, $2)`,
        [submission.firstName, submission.email]
      );
    } catch (err) {
      console.error("DB insert (guide lead) failed:", err);
    }
  }

  // Always persist to disk as a durable record.
  try {
    fs.appendFileSync(SUBMISSIONS_FILE, JSON.stringify(submission) + "\n");
  } catch (err) {
    console.error("Failed to write submission:", err);
  }

  // Email the coach if a transport is configured.
  if (transporter) {
    const rows = [
      ["Name", submission.firstName],
      ["Email", submission.email],
      ["Received", submission.receivedAt],
    ];
    try {
      await transporter.sendMail({
        from: `"Lift & Inspire" <${mailFrom}>`,
        to: APPLY_TO,
        replyTo: submission.email,
        subject: `New free-guide lead — ${submission.firstName}`,
        text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#2c2c2a">
            <h2 style="color:#c4714a;margin:0 0 4px">New free-guide lead 🎁</h2>
            <p style="color:#6b6560;margin:0 0 20px">Someone requested the free starter guide.</p>
            <table style="width:100%;border-collapse:collapse">
              ${rows
                .map(
                  ([k, v]) =>
                    `<tr><td style="padding:8px 12px;background:#faf7f2;border:1px solid #e8ddd0;font-weight:bold;width:160px">${k}</td><td style="padding:8px 12px;border:1px solid #e8ddd0">${v}</td></tr>`
                )
                .join("")}
            </table>
          </div>`,
      });
      console.log("✉️  Guide lead emailed for:", submission.email);
    } catch (err) {
      console.error("Failed to send email:", err);
    }
  } else {
    console.log("📥 New guide lead stored:", submission.email);
  }

  res.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────
// Blog + admin
// ─────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const adminEnabled = Boolean(JWT_SECRET && ADMIN_EMAIL && ADMIN_PASSWORD);

// Turn a title into a URL-friendly slug.
function slugify(str) {
  return String(str)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Shape a DB row into the JSON the client expects.
function toPost(row, { withHtml = false } = {}) {
  if (!row) return null;
  const post = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImage: row.cover_image,
    content: row.content,
    author: row.author,
    published: row.published,
    lang: row.lang,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (withHtml) post.contentHtml = marked.parse(row.content || "");
  return post;
}

// Verify the admin bearer token on protected routes.
function requireAuth(req, res, next) {
  if (!adminEnabled) {
    return res.status(503).json({ ok: false, error: "Admin is not configured on the server." });
  }
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, error: "Not authenticated." });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Session expired. Please log in again." });
  }
}

// ── Admin login ──
app.post("/api/admin/login", (req, res) => {
  if (!adminEnabled) {
    return res.status(503).json({ ok: false, error: "Admin is not configured on the server." });
  }
  const { email, password } = req.body || {};
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: "Incorrect email or password." });
  }
  const token = jwt.sign({ sub: email, role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ ok: true, token });
});

// ── Public: list published posts (filtered by language) ──
app.get("/api/posts", async (req, res) => {
  if (!dbEnabled) return res.json({ ok: true, posts: [] });
  try {
    const lang = req.query.lang;
    // Posts match the requested language; untagged/legacy posts (null/empty)
    // show in every language so nothing disappears.
    const rows = lang
      ? (await query(
          `select * from posts where published = true and (lang = $1 or lang is null or lang = '')
           order by created_at desc`,
          [lang]
        )).rows
      : (await query(`select * from posts where published = true order by created_at desc`)).rows;
    res.json({ ok: true, posts: rows.map((r) => toPost(r)) });
  } catch (err) {
    console.error("Fetch posts failed:", err);
    res.status(500).json({ ok: false, error: "Could not load posts." });
  }
});

// ── Public: single published post by slug ──
app.get("/api/posts/:slug", async (req, res) => {
  if (!dbEnabled) return res.status(404).json({ ok: false, error: "Not found." });
  try {
    const { rows } = await query(
      `select * from posts where slug = $1 and published = true limit 1`,
      [req.params.slug]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, error: "Post not found." });
    res.json({ ok: true, post: toPost(rows[0], { withHtml: true }) });
  } catch (err) {
    console.error("Fetch post failed:", err);
    res.status(500).json({ ok: false, error: "Could not load the post." });
  }
});

// ── Admin: list all posts (incl. drafts) ──
app.get("/api/admin/posts", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(`select * from posts order by created_at desc`);
    res.json({ ok: true, posts: rows.map((r) => toPost(r)) });
  } catch (err) {
    console.error("Admin fetch posts failed:", err);
    res.status(500).json({ ok: false, error: "Could not load posts." });
  }
});

// ── Admin: create a post ──
app.post("/api/admin/posts", requireAuth, async (req, res) => {
  const { title, excerpt, coverImage, content, author, published, lang } = req.body || {};
  if (!title || !String(title).trim()) {
    return res.status(400).json({ ok: false, error: "A title is required." });
  }
  let slug = slugify(req.body.slug || title);
  if (!slug) slug = `post-${Date.now()}`;
  try {
    // Ensure the slug is unique by appending a short suffix on collision.
    const existing = await query(`select 1 from posts where slug = $1`, [slug]);
    if (existing.rows[0]) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    const { rows } = await query(
      `insert into posts (slug, title, excerpt, cover_image, content, author, published, lang)
       values ($1, $2, $3, $4, $5, $6, $7, $8) returning *`,
      [slug, String(title).trim(), excerpt || "", coverImage || "", content || "", author || "Claudia Bittner", Boolean(published), lang === "en" ? "en" : "es"]
    );
    res.json({ ok: true, post: toPost(rows[0]) });
  } catch (err) {
    console.error("Create post failed:", err);
    res.status(500).json({ ok: false, error: "Could not create the post." });
  }
});

// ── Admin: update a post ──
app.put("/api/admin/posts/:id", requireAuth, async (req, res) => {
  const { title, excerpt, coverImage, content, author, published, slug, lang } = req.body || {};
  try {
    const { rows } = await query(
      `update posts set
         title = coalesce($2, title),
         slug = coalesce($3, slug),
         excerpt = coalesce($4, excerpt),
         cover_image = coalesce($5, cover_image),
         content = coalesce($6, content),
         author = coalesce($7, author),
         published = coalesce($8, published),
         lang = coalesce($9, lang),
         updated_at = now()
       where id = $1 returning *`,
      [
        req.params.id,
        title != null ? String(title).trim() : null,
        slug != null ? slugify(slug) : null,
        excerpt,
        coverImage,
        content,
        author,
        published != null ? Boolean(published) : null,
        lang != null ? (lang === "en" ? "en" : "es") : null,
      ]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, error: "Post not found." });
    res.json({ ok: true, post: toPost(rows[0]) });
  } catch (err) {
    console.error("Update post failed:", err);
    res.status(500).json({ ok: false, error: "Could not update the post." });
  }
});

// ── Admin: delete a post ──
app.delete("/api/admin/posts/:id", requireAuth, async (req, res) => {
  try {
    await query(`delete from posts where id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete post failed:", err);
    res.status(500).json({ ok: false, error: "Could not delete the post." });
  }
});

// ─────────────────────────────────────────────────────────────
// Workout tracker — member accounts + workout logging
// ─────────────────────────────────────────────────────────────
const userAuthEnabled = Boolean(JWT_SECRET && dbEnabled);

function isStrongEnough(pw) {
  return typeof pw === "string" && pw.length >= 6;
}

// Verify a member (user) bearer token.
function requireUser(req, res, next) {
  if (!userAuthEnabled) {
    return res.status(503).json({ ok: false, error: "The workout tracker is not configured on the server." });
  }
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, error: "Not authenticated." });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "user") throw new Error("wrong role");
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Session expired. Please log in again." });
  }
}

function signUserToken(user) {
  return jwt.sign({ sub: user.id, role: "user", name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
}

// ── Sign up ──
app.post("/api/auth/signup", async (req, res) => {
  if (!userAuthEnabled) return res.status(503).json({ ok: false, error: "The workout tracker is not configured on the server." });
  const { name, email, password } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ ok: false, error: "Please enter your name." });
  if (!isValidEmail(email)) return res.status(400).json({ ok: false, error: "Please enter a valid email." });
  if (!isStrongEnough(password)) return res.status(400).json({ ok: false, error: "Password must be at least 6 characters." });
  try {
    const exists = await query(`select 1 from users where email = $1`, [String(email).trim().toLowerCase()]);
    if (exists.rows[0]) return res.status(409).json({ ok: false, error: "An account with this email already exists." });
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `insert into users (name, email, password_hash) values ($1, $2, $3) returning id, name, email`,
      [String(name).trim(), String(email).trim().toLowerCase(), hash]
    );
    const user = rows[0];
    res.json({ ok: true, token: signUserToken(user), user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Signup failed:", err);
    res.status(500).json({ ok: false, error: "Could not create your account." });
  }
});

// ── Log in ──
app.post("/api/auth/login", async (req, res) => {
  if (!userAuthEnabled) return res.status(503).json({ ok: false, error: "The workout tracker is not configured on the server." });
  const { email, password } = req.body || {};
  if (!isValidEmail(email) || !password) return res.status(400).json({ ok: false, error: "Email and password are required." });
  try {
    const { rows } = await query(`select * from users where email = $1`, [String(email).trim().toLowerCase()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ ok: false, error: "Incorrect email or password." });
    }
    res.json({ ok: true, token: signUserToken(user), user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Login failed:", err);
    res.status(500).json({ ok: false, error: "Could not log you in." });
  }
});

// ── Exercise library ──
app.get("/api/exercises", requireUser, async (req, res) => {
  try {
    const { rows } = await query(`select id, name, muscle_group, equipment, media_url, instructions from exercises order by name`);
    res.json({ ok: true, exercises: rows });
  } catch (err) {
    console.error("Fetch exercises failed:", err);
    res.status(500).json({ ok: false, error: "Could not load exercises." });
  }
});

// ── Last performance for an exercise (for the "last time" + suggestion) ──
app.get("/api/last-performance/:exerciseId", requireUser, async (req, res) => {
  try {
    const { rows } = await query(
      `select s.weight, s.reps, s.rir, s.set_number, w.performed_at
       from workout_sets s
       join workouts w on w.id = s.workout_id
       where w.user_id = $1 and s.exercise_id = $2
         and w.id = (
           select w2.id from workouts w2
           join workout_sets s2 on s2.workout_id = w2.id
           where w2.user_id = $1 and s2.exercise_id = $2
           order by w2.performed_at desc limit 1
         )
       order by s.set_number`,
      [req.user.sub, req.params.exerciseId]
    );
    res.json({ ok: true, sets: rows, performedAt: rows[0]?.performed_at || null });
  } catch (err) {
    console.error("Last performance failed:", err);
    res.status(500).json({ ok: false, error: "Could not load history." });
  }
});

// ── Create a workout (with its sets) ──
app.post("/api/workouts", requireUser, async (req, res) => {
  const { title, performedAt, notes, sets } = req.body || {};
  if (!Array.isArray(sets) || sets.length === 0) {
    return res.status(400).json({ ok: false, error: "Add at least one set before saving." });
  }
  const client = await pool.connect();
  try {
    await client.query("begin");
    const w = await client.query(
      `insert into workouts (user_id, title, performed_at, notes)
       values ($1, $2, coalesce($3, now()), $4) returning *`,
      [req.user.sub, String(title || "Workout").trim(), performedAt || null, String(notes || "").trim()]
    );
    const workout = w.rows[0];
    for (const s of sets) {
      await client.query(
        `insert into workout_sets (workout_id, exercise_id, exercise_name, set_number, weight, reps, rir, rpe)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          workout.id,
          s.exerciseId || null,
          String(s.exerciseName || "Exercise"),
          Number(s.setNumber) || 1,
          s.weight === "" || s.weight == null ? 0 : Number(s.weight),
          s.reps === "" || s.reps == null ? 0 : Number(s.reps),
          s.rir === "" || s.rir == null ? null : Number(s.rir),
          s.rpe === "" || s.rpe == null ? null : Number(s.rpe),
        ]
      );
    }
    await client.query("commit");
    res.json({ ok: true, workout });
  } catch (err) {
    await client.query("rollback");
    console.error("Create workout failed:", err);
    res.status(500).json({ ok: false, error: "Could not save the workout." });
  } finally {
    client.release();
  }
});

// ── List the user's workouts (with a short summary) ──
app.get("/api/workouts", requireUser, async (req, res) => {
  try {
    const { rows } = await query(
      `select w.id, w.title, w.performed_at, w.notes,
              count(s.id)::int as set_count,
              count(distinct s.exercise_name)::int as exercise_count
       from workouts w
       left join workout_sets s on s.workout_id = w.id
       where w.user_id = $1
       group by w.id
       order by w.performed_at desc`,
      [req.user.sub]
    );
    res.json({ ok: true, workouts: rows });
  } catch (err) {
    console.error("List workouts failed:", err);
    res.status(500).json({ ok: false, error: "Could not load your workouts." });
  }
});

// ── Single workout with its sets ──
app.get("/api/workouts/:id", requireUser, async (req, res) => {
  try {
    const w = await query(`select * from workouts where id = $1 and user_id = $2`, [req.params.id, req.user.sub]);
    if (!w.rows[0]) return res.status(404).json({ ok: false, error: "Workout not found." });
    const s = await query(`select * from workout_sets where workout_id = $1 order by set_number`, [req.params.id]);
    res.json({ ok: true, workout: w.rows[0], sets: s.rows });
  } catch (err) {
    console.error("Fetch workout failed:", err);
    res.status(500).json({ ok: false, error: "Could not load the workout." });
  }
});

// ── Delete a workout ──
app.delete("/api/workouts/:id", requireUser, async (req, res) => {
  try {
    await query(`delete from workouts where id = $1 and user_id = $2`, [req.params.id, req.user.sub]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete workout failed:", err);
    res.status(500).json({ ok: false, error: "Could not delete the workout." });
  }
});

// ── Get the user's routine (A/B/C rotation) ──
app.get("/api/routine", requireUser, async (req, res) => {
  try {
    const r = await query(`select * from routines where user_id = $1`, [req.user.sub]);
    if (!r.rows[0]) return res.json({ ok: true, routine: null });
    const routine = r.rows[0];
    const d = await query(`select position, name, exercise_ids from routine_days where routine_id = $1 order by position`, [routine.id]);
    res.json({
      ok: true,
      routine: {
        name: routine.name,
        nextIndex: routine.next_index,
        days: d.rows.map((x) => ({ position: x.position, name: x.name, exerciseIds: x.exercise_ids || [] })),
      },
    });
  } catch (err) {
    console.error("Get routine failed:", err);
    res.status(500).json({ ok: false, error: "Could not load your routine." });
  }
});

// ── Create / replace the user's routine ──
app.put("/api/routine", requireUser, async (req, res) => {
  const { name, days } = req.body || {};
  if (!Array.isArray(days)) return res.status(400).json({ ok: false, error: "Days are required." });
  const client = await pool.connect();
  try {
    await client.query("begin");
    const existing = await client.query(`select id, next_index from routines where user_id = $1`, [req.user.sub]);
    let routineId;
    if (existing.rows[0]) {
      routineId = existing.rows[0].id;
      const clamp = days.length > 0 ? existing.rows[0].next_index % days.length : 0;
      await client.query(`update routines set name = $2, next_index = $3 where id = $1`, [routineId, String(name || "My Routine").trim(), clamp]);
      await client.query(`delete from routine_days where routine_id = $1`, [routineId]);
    } else {
      const ins = await client.query(`insert into routines (user_id, name) values ($1, $2) returning id`, [req.user.sub, String(name || "My Routine").trim()]);
      routineId = ins.rows[0].id;
    }
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const ids = Array.isArray(day.exerciseIds) ? day.exerciseIds.filter(Boolean) : [];
      await client.query(
        `insert into routine_days (routine_id, position, name, exercise_ids) values ($1, $2, $3, $4)`,
        [routineId, i, String(day.name || `Day ${i + 1}`).trim(), ids]
      );
    }
    await client.query("commit");
    res.json({ ok: true });
  } catch (err) {
    await client.query("rollback");
    console.error("Save routine failed:", err);
    res.status(500).json({ ok: false, error: "Could not save your routine." });
  } finally {
    client.release();
  }
});

// ── Advance the rotation pointer (after completing a routine day) ──
app.post("/api/routine/advance", requireUser, async (req, res) => {
  try {
    const r = await query(`select r.id, r.next_index, count(d.id)::int as day_count
                           from routines r left join routine_days d on d.routine_id = r.id
                           where r.user_id = $1 group by r.id`, [req.user.sub]);
    if (!r.rows[0] || r.rows[0].day_count === 0) return res.json({ ok: true });
    const { id, next_index, day_count } = r.rows[0];
    await query(`update routines set next_index = $2 where id = $1`, [id, (next_index + 1) % day_count]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Advance routine failed:", err);
    res.status(500).json({ ok: false, error: "Could not advance your routine." });
  }
});

// ── Progress data for an exercise (for charts) ──
app.get("/api/progress/:exerciseId", requireUser, async (req, res) => {
  try {
    const { rows } = await query(
      `select to_char(w.performed_at, 'YYYY-MM-DD') as date,
              max(s.weight)::float as top_weight,
              max(s.weight * (1 + s.reps / 30.0))::float as est_1rm,
              sum(s.weight * s.reps)::float as volume
       from workouts w
       join workout_sets s on s.workout_id = w.id
       where w.user_id = $1 and s.exercise_id = $2
       group by w.performed_at::date, to_char(w.performed_at, 'YYYY-MM-DD')
       order by w.performed_at::date`,
      [req.user.sub, req.params.exerciseId]
    );
    res.json({ ok: true, points: rows });
  } catch (err) {
    console.error("Progress failed:", err);
    res.status(500).json({ ok: false, error: "Could not load progress." });
  }
});

// ── Flat export of all the user's sets (for Excel) ──
app.get("/api/export", requireUser, async (req, res) => {
  try {
    const { rows } = await query(
      `select to_char(w.performed_at, 'YYYY-MM-DD') as date, w.title,
              s.exercise_name, s.set_number, s.weight, s.reps, s.rir
       from workouts w
       join workout_sets s on s.workout_id = w.id
       where w.user_id = $1
       order by w.performed_at desc, s.exercise_name, s.set_number`,
      [req.user.sub]
    );
    res.json({ ok: true, rows });
  } catch (err) {
    console.error("Export failed:", err);
    res.status(500).json({ ok: false, error: "Could not export your data." });
  }
});

// ── Serve the built React client ──
const CLIENT_DIST = path.join(__dirname, "client", "dist");
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  // SPA fallback for any non-API GET route.
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API running ✅  — run `npm run build` to generate the client, or use `npm run dev`.");
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(
    transporter
      ? `✉️  Email enabled — applications sent to ${APPLY_TO}`
      : "💾 Email disabled — applications saved to submissions.jsonl (set GMAIL_USER + GMAIL_APP_PASSWORD to enable)"
  );
});
