import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { marked } from "marked";
import { dbEnabled, query, pool } from "./db.js";
import { clampSets } from "./lib/plan.js";
import { parseFeedback } from "./lib/feedback.js";
import { lbToKg } from "./lib/units.js";
import { isApproved } from "./lib/status.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "8mb" })); // posts carry Markdown + check-in photos (data URLs)

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
const CALENDLY_URL = process.env.CALENDLY_URL || "https://calendly.com/0liftandinspire0/30min";

// Sends an email through the configured transport AND records it in the
// email_log table (best-effort) so every message is auditable from the admin
// dashboard. `type` groups messages (e.g. "application_autoreply").
async function sendMail(type, options) {
  let status = "sent";
  let errorMessage = null;
  try {
    if (!transporter) {
      status = "skipped"; // no email transport configured on this server
      return;
    }
    await transporter.sendMail(options);
  } catch (err) {
    status = "failed";
    errorMessage = err.message;
    throw err; // let the caller's existing catch log/handle it too
  } finally {
    if (dbEnabled) {
      const to = Array.isArray(options.to) ? options.to.join(", ") : options.to || "";
      query(
        `insert into email_log (type, recipient, subject, body, status, error)
         values ($1, $2, $3, $4, $5, $6)`,
        [type, to, options.subject || "", options.text || "", status, errorMessage]
      ).catch((e) => console.error("email_log insert failed:", e.message));
    }
  }
}

// Builds the friendly auto-reply we send to an applicant, in their language,
// inviting them to book the discovery call via Calendly.
function applicantAutoReply(firstName, lang, feedbackUrl) {
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
  // Gentle P.S. for anyone who has already worked with Claudia.
  const psText = es ? "¿Ya trabajaste conmigo?" : "Already worked with me?";
  const psLink = es ? "Comparte tu experiencia" : "Share your experience";

  const text =
    `${intro}\n\n${cta}\n${CALENDLY_URL}\n\n${closing}\n\n${es ? "Con cariño, Claudia · Lift & Inspire" : "Warmly, Claudia · Lift & Inspire"}` +
    (feedbackUrl ? `\n\nP.D. ${psText} ${psLink}: ${feedbackUrl}` : "");
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;color:#2c2c2a;line-height:1.6">
      <h2 style="color:#b07d1f;margin:0 0 16px">${es ? "¡Gracias por aplicar!" : "Thanks for applying!"}</h2>
      <p style="margin:0 0 16px">${intro}</p>
      <p style="margin:0 0 20px">${cta}</p>
      <p style="margin:0 0 28px">
        <a href="${CALENDLY_URL}" style="background:#b07d1f;color:#fff;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:999px;display:inline-block">${button}</a>
      </p>
      <p style="margin:0 0 16px">${closing}</p>
      <p style="margin:0 0 20px;color:#6b6560">${signature}</p>
      ${feedbackUrl ? `<p style="margin:0;padding-top:16px;border-top:1px solid #e8ddd0;color:#6b6560;font-size:13px">${psText} <a href="${feedbackUrl}" style="color:#b07d1f;font-weight:bold;text-decoration:none">${psLink} →</a></p>` : ""}
    </div>`;
  return { subject, text, html };
}

// Public base URL of the site, used to build links in transactional emails
// (e.g. the password-reset link). Falls back to the request's own host.
const APP_BASE_URL = process.env.APP_BASE_URL || "";

// Builds the password-reset email in the member's language.
function passwordResetEmail(name, resetUrl, lang) {
  const es = lang !== "en";
  const firstName = (name || "").split(" ")[0] || (es ? "ahí" : "there");
  const subject = es ? "Restablece tu contraseña 🔑" : "Reset your password 🔑";
  const intro = es
    ? `¡Hola ${firstName}! Recibimos una solicitud para restablecer la contraseña de tu cuenta de Lift & Inspire.`
    : `Hi ${firstName}! We received a request to reset the password for your Lift & Inspire account.`;
  const cta = es
    ? "Haz clic en el botón para elegir una nueva contraseña. Este enlace caduca en 1 hora."
    : "Click the button below to choose a new password. This link expires in 1 hour.";
  const button = es ? "Restablecer contraseña →" : "Reset password →";
  const ignore = es
    ? "Si no solicitaste esto, puedes ignorar este correo; tu contraseña no cambiará."
    : "If you didn't request this, you can safely ignore this email — your password won't change.";
  const signature = es ? "Con cariño,<br>Lift & Inspire" : "Warmly,<br>Lift & Inspire";

  const text = `${intro}\n\n${cta}\n${resetUrl}\n\n${ignore}\n\n${es ? "Con cariño, Lift & Inspire" : "Warmly, Lift & Inspire"}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;color:#2c2c2a;line-height:1.6">
      <h2 style="color:#b07d1f;margin:0 0 16px">${es ? "Restablece tu contraseña" : "Reset your password"}</h2>
      <p style="margin:0 0 16px">${intro}</p>
      <p style="margin:0 0 20px">${cta}</p>
      <p style="margin:0 0 28px">
        <a href="${resetUrl}" style="background:#b07d1f;color:#fff;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:999px;display:inline-block">${button}</a>
      </p>
      <p style="margin:0 0 16px;color:#6b6560;font-size:13px">${ignore}</p>
      <p style="margin:0;color:#6b6560">${signature}</p>
    </div>`;
  return { subject, text, html };
}

// Where applications are appended when email isn't configured.
const SUBMISSIONS_FILE = path.join(__dirname, "submissions.jsonl");

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Health / diagnostics ──
// Open /api/health in a browser to see whether the database connects, which
// tables exist, and how many blog posts are stored. Never exposes secrets.
app.get("/api/health", async (req, res) => {
  const health = { ok: true, dbConfigured: dbEnabled, email: Boolean(transporter), nutrition: fatsecretEnabled };
  if (!dbEnabled) {
    health.db = "not_configured"; // DATABASE_URL is not set
    return res.json(health);
  }
  try {
    await query("select 1");
    health.db = "connected";
    const want = ["posts", "users", "applications", "intakes", "guide_leads", "password_resets", "testimonials", "email_log", "nutrition_logs", "saved_meals", "nutrition_goals"];
    const { rows } = await query(
      `select table_name from information_schema.tables where table_schema = 'public' and table_name = any($1)`,
      [want]
    );
    const present = rows.map((r) => r.table_name);
    health.tables = Object.fromEntries(want.map((t) => [t, present.includes(t)]));
    if (present.includes("posts")) {
      const c = await query(`select count(*)::int as total, count(*) filter (where published)::int as published from posts`);
      health.posts = c.rows[0];
    }
    if (present.includes("users")) {
      const u = await query(`select count(*)::int as total from users`);
      health.users = u.rows[0].total;
    }
  } catch (err) {
    health.ok = false;
    health.db = "error";
    health.dbError = err.message; // e.g. "password authentication failed" — no secrets
  }
  res.json(health);
});

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
      await sendMail("application", {
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
      const base = APP_BASE_URL || `${req.protocol}://${req.get("host")}`;
      const feedbackUrl = `${base.replace(/\/$/, "")}/feedback`;
      const reply = applicantAutoReply(submission.firstName, lang, feedbackUrl);
      await sendMail("application_autoreply", {
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
      await sendMail("intake", {
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
      await sendMail("guide_lead", {
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
  // Be forgiving about whitespace and email casing (common copy/paste gotchas).
  const emailOk = String(email || "").trim().toLowerCase() === String(ADMIN_EMAIL).trim().toLowerCase();
  const passOk = String(password || "").trim() === String(ADMIN_PASSWORD).trim();
  if (!emailOk || !passOk) {
    return res.status(401).json({ ok: false, error: "Incorrect email or password." });
  }
  const token = jwt.sign({ sub: ADMIN_EMAIL, role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
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
// Testimonials — clients submit feedback; coach approves + shares
// ─────────────────────────────────────────────────────────────
function toTestimonial(row, { withEmail = false } = {}) {
  const t = {
    id: row.id,
    name: row.name,
    detail: row.detail || "",
    rating: row.rating,
    text: row.text,
    image: row.image || "",
    lang: row.lang || "",
    published: row.published,
    featured: row.featured,
    createdAt: row.created_at,
  };
  if (withEmail) t.email = row.email || "";
  return t;
}

// ── Public: submit a testimonial (awaits approval) ──
app.post("/api/testimonials", async (req, res) => {
  if (!dbEnabled) return res.status(503).json({ ok: false, error: "Testimonials are not configured on the server." });
  const { name, detail, email, rating, text, lang } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ ok: false, error: "Please enter your name." });
  if (!text || !String(text).trim()) return res.status(400).json({ ok: false, error: "Please share a few words about your experience." });
  if (email && !isValidEmail(email)) return res.status(400).json({ ok: false, error: "Please enter a valid email." });
  const r = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
  try {
    const { rows } = await query(
      `insert into testimonials (name, detail, email, rating, text, lang)
       values ($1, $2, $3, $4, $5, $6) returning *`,
      [String(name).trim(), String(detail || "").trim(), String(email || "").trim().toLowerCase(), r, String(text).trim(), lang === "en" ? "en" : "es"]
    );
    // Notify the coach if email is configured (the testimonial is already saved).
    if (transporter) {
      try {
        await sendMail("testimonial", {
          from: `"Lift & Inspire" <${mailFrom}>`,
          to: APPLY_TO,
          replyTo: email || undefined,
          subject: `New testimonial from ${String(name).trim()} (${r}★)`,
          text: `${String(name).trim()}${detail ? ` — ${detail}` : ""}\nRating: ${r}/5\n\n${String(text).trim()}\n\nReview & publish it in the admin dashboard.`,
        });
      } catch (err) {
        console.error("Failed to send testimonial notification:", err);
      }
    }
    res.json({ ok: true, testimonial: toTestimonial(rows[0]) });
  } catch (err) {
    console.error("Submit testimonial failed:", err);
    res.status(500).json({ ok: false, error: "Could not submit your testimonial." });
  }
});

// ── Public: list published testimonials (optionally by language) ──
app.get("/api/testimonials", async (req, res) => {
  if (!dbEnabled) return res.json({ ok: true, testimonials: [] });
  try {
    const lang = req.query.lang;
    const rows = lang
      ? (await query(
          `select * from testimonials where published = true and (lang = $1 or lang is null or lang = '')
           order by featured desc, created_at desc`,
          [lang]
        )).rows
      : (await query(`select * from testimonials where published = true order by featured desc, created_at desc`)).rows;
    res.json({ ok: true, testimonials: rows.map((r) => toTestimonial(r)) });
  } catch (err) {
    console.error("Fetch testimonials failed:", err);
    res.status(500).json({ ok: false, error: "Could not load testimonials." });
  }
});

// ── Admin: list all testimonials (incl. pending) ──
app.get("/api/admin/testimonials", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(`select * from testimonials order by created_at desc`);
    res.json({ ok: true, testimonials: rows.map((r) => toTestimonial(r, { withEmail: true })) });
  } catch (err) {
    console.error("Admin fetch testimonials failed:", err);
    res.status(500).json({ ok: false, error: "Could not load testimonials." });
  }
});

// ── Admin: list sent emails (most recent first) ──
app.get("/api/admin/emails", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(`select * from email_log order by created_at desc limit 200`);
    res.json({ ok: true, emails: rows });
  } catch (err) {
    console.error("Admin fetch emails failed:", err);
    res.status(500).json({ ok: false, error: "Could not load the email log." });
  }
});

// ── Admin: update a testimonial (approve, feature, edit, add avatar) ──
app.put("/api/admin/testimonials/:id", requireAuth, async (req, res) => {
  const { name, detail, text, image, rating, published, featured, lang } = req.body || {};
  try {
    const { rows } = await query(
      `update testimonials set
         name = coalesce($2, name),
         detail = coalesce($3, detail),
         text = coalesce($4, text),
         image = coalesce($5, image),
         rating = coalesce($6, rating),
         published = coalesce($7, published),
         featured = coalesce($8, featured),
         lang = coalesce($9, lang)
       where id = $1 returning *`,
      [
        req.params.id,
        name != null ? String(name).trim() : null,
        detail != null ? String(detail).trim() : null,
        text != null ? String(text).trim() : null,
        image != null ? String(image).trim() : null,
        rating != null ? Math.min(5, Math.max(1, parseInt(rating, 10) || 5)) : null,
        published != null ? Boolean(published) : null,
        featured != null ? Boolean(featured) : null,
        lang != null ? (lang === "en" ? "en" : "es") : null,
      ]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, error: "Testimonial not found." });
    res.json({ ok: true, testimonial: toTestimonial(rows[0], { withEmail: true }) });
  } catch (err) {
    console.error("Update testimonial failed:", err);
    res.status(500).json({ ok: false, error: "Could not update the testimonial." });
  }
});

// ── Admin: delete a testimonial ──
app.delete("/api/admin/testimonials/:id", requireAuth, async (req, res) => {
  try {
    await query(`delete from testimonials where id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete testimonial failed:", err);
    res.status(500).json({ ok: false, error: "Could not delete the testimonial." });
  }
});

// ─────────────────────────────────────────────────────────────
// Workout tracker — member accounts + workout logging
// ─────────────────────────────────────────────────────────────
const userAuthEnabled = Boolean(JWT_SECRET && dbEnabled);

function isStrongEnough(pw) {
  return typeof pw === "string" && pw.length >= 6;
}

// Verify a member (user) bearer token, and that the account is still approved
// (so a rejected/revoked member is blocked immediately even with a live token).
async function requireUser(req, res, next) {
  if (!userAuthEnabled) {
    return res.status(503).json({ ok: false, error: "The workout tracker is not configured on the server." });
  }
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, error: "Not authenticated." });
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "user") throw new Error("wrong role");
  } catch {
    return res.status(401).json({ ok: false, error: "Session expired. Please log in again." });
  }
  try {
    const { rows } = await query(`select status from users where id = $1`, [payload.sub]);
    if (!rows[0] || !isApproved(rows[0].status)) {
      return res.status(401).json({ ok: false, error: "Your account is no longer active. Contact your coach." });
    }
  } catch (err) {
    console.error("Account status check failed:", err);
    return res.status(500).json({ ok: false, error: "Could not verify your account." });
  }
  req.user = payload;
  next();
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
    // Self-signups start as 'pending' — the coach approves them in the admin
    // panel. No token is issued, so they cannot log in until approved.
    await query(
      `insert into users (name, email, password_hash, status) values ($1, $2, $3, 'pending')`,
      [String(name).trim(), String(email).trim().toLowerCase(), hash]
    );
    res.json({ ok: true, pending: true, message: "Request sent. Your coach will review and approve your account soon." });
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
    if (!isApproved(user.status)) {
      const msg = user.status === "rejected"
        ? "Your account request was declined. Please contact your coach."
        : "Your account is pending approval by your coach.";
      return res.status(403).json({ ok: false, error: msg });
    }
    res.json({ ok: true, token: signUserToken(user), user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Login failed:", err);
    res.status(500).json({ ok: false, error: "Could not log you in." });
  }
});

// ── Forgot password (request a reset link) ──
// Always responds with { ok: true } regardless of whether the email exists,
// so the endpoint can't be used to discover which emails have accounts.
app.post("/api/auth/forgot-password", async (req, res) => {
  if (!userAuthEnabled) return res.status(503).json({ ok: false, error: "The workout tracker is not configured on the server." });
  const { email, lang } = req.body || {};
  if (!isValidEmail(email)) return res.status(400).json({ ok: false, error: "Please enter a valid email." });
  try {
    const { rows } = await query(`select id, name, email from users where email = $1`, [String(email).trim().toLowerCase()]);
    const user = rows[0];
    if (user) {
      // Invalidate any earlier outstanding tokens for this user.
      await query(`update password_resets set used_at = now() where user_id = $1 and used_at is null`, [user.id]);
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await query(
        `insert into password_resets (user_id, token_hash, expires_at) values ($1, $2, $3)`,
        [user.id, tokenHash, expires]
      );

      const base = APP_BASE_URL || `${req.protocol}://${req.get("host")}`;
      const resetUrl = `${base.replace(/\/$/, "")}/reset-password?token=${rawToken}`;

      if (transporter) {
        try {
          const mail = passwordResetEmail(user.name, resetUrl, lang);
          await sendMail("password_reset", {
            from: `"Lift & Inspire" <${mailFrom}>`,
            to: user.email,
            subject: mail.subject,
            text: mail.text,
            html: mail.html,
          });
          console.log("✉️  Password reset email sent to:", user.email);
        } catch (err) {
          console.error("Failed to send password reset email:", err);
        }
      } else {
        // No email configured (local dev) — log the link so it can still be used.
        console.log("🔑 Password reset link (email not configured):", resetUrl);
      }
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Forgot password failed:", err);
    res.status(500).json({ ok: false, error: "Could not process your request." });
  }
});

// ── Reset password (consume the token) ──
app.post("/api/auth/reset-password", async (req, res) => {
  if (!userAuthEnabled) return res.status(503).json({ ok: false, error: "The workout tracker is not configured on the server." });
  const { token, password } = req.body || {};
  if (!token || typeof token !== "string") return res.status(400).json({ ok: false, error: "Invalid or missing reset token." });
  if (!isStrongEnough(password)) return res.status(400).json({ ok: false, error: "Password must be at least 6 characters." });
  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const { rows } = await query(
      `select id, user_id from password_resets where token_hash = $1 and used_at is null and expires_at > now()`,
      [tokenHash]
    );
    const record = rows[0];
    if (!record) return res.status(400).json({ ok: false, error: "This reset link is invalid or has expired. Please request a new one." });

    const hash = await bcrypt.hash(password, 10);
    await query(`update users set password_hash = $1 where id = $2`, [hash, record.user_id]);
    await query(`update password_resets set used_at = now() where id = $1`, [record.id]);

    const { rows: urows } = await query(`select id, name, email from users where id = $1`, [record.user_id]);
    const user = urows[0];
    res.json({ ok: true, token: signUserToken(user), user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Reset password failed:", err);
    res.status(500).json({ ok: false, error: "Could not reset your password." });
  }
});

// ── Exercise library ──
app.get("/api/exercises", requireUser, async (req, res) => {
  try {
    // The shared default library (owner_id is null) plus this member's own.
    const { rows } = await query(
      `select id, name, muscle_group, equipment, media_url, instructions, owner_id
       from exercises where owner_id is null or owner_id = $1 order by name`,
      [req.user.sub]
    );
    res.json({ ok: true, exercises: rows });
  } catch (err) {
    console.error("Fetch exercises failed:", err);
    res.status(500).json({ ok: false, error: "Could not load exercises." });
  }
});

// ── Add an exercise to the member's catalog ──
app.post("/api/exercises", requireUser, async (req, res) => {
  const { name, muscleGroup, mediaUrl, instructions, equipment } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ ok: false, error: "An exercise name is required." });
  try {
    const { rows } = await query(
      `insert into exercises (name, muscle_group, equipment, media_url, instructions, owner_id)
       values ($1, $2, $3, $4, $5, $6)
       returning id, name, muscle_group, equipment, media_url, instructions, owner_id`,
      [
        String(name).trim(),
        String(muscleGroup || "").trim().toLowerCase(),
        String(equipment || "").trim(),
        String(mediaUrl || "").trim(),
        String(instructions || "").trim(),
        req.user.sub,
      ]
    );
    res.json({ ok: true, exercise: rows[0] });
  } catch (err) {
    console.error("Create exercise failed:", err);
    res.status(500).json({ ok: false, error: "Could not add the exercise." });
  }
});

// ── Delete one of the member's own exercises (defaults can't be removed) ──
app.delete("/api/exercises/:id", requireUser, async (req, res) => {
  try {
    const { rowCount } = await query(`delete from exercises where id = $1 and owner_id = $2`, [req.params.id, req.user.sub]);
    if (rowCount === 0) return res.status(403).json({ ok: false, error: "You can only delete exercises you added." });
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete exercise failed:", err);
    res.status(500).json({ ok: false, error: "Could not delete the exercise." });
  }
});

// ── Exercise demo GIF (proxy to ExerciseDB / RapidAPI, key stays server-side) ──
// Public: used from the member app AND the coach panel. Returns { gif: url|null }.
// Fetches the anatomical exercise GIF by name. Degrades to null (modal falls
// back to a YouTube search) when EXERCISEDB_KEY is unset or nothing matches.
// Results are cached in memory by exercise name. Add ?debug=1 to see why a
// lookup returned null (does not expose the key).
const gifCache = new Map();
// ExerciseDB response shapes vary by version: bare array, { data: [...] },
// { data: { exercises: [...] } }, etc. Pull the first item's gif URL robustly.
function extractGif(data) {
  const arr = Array.isArray(data) ? data
    : Array.isArray(data?.data) ? data.data
    : Array.isArray(data?.data?.exercises) ? data.data.exercises
    : Array.isArray(data?.exercises) ? data.exercises
    : Array.isArray(data?.results) ? data.results
    : [];
  const g = arr[0] || null;
  return (g && (g.gifUrl || g.gif || g.image)) || null;
}
app.get("/api/exercise-gif", async (req, res) => {
  const key = process.env.EXERCISEDB_KEY;
  const host = process.env.EXERCISEDB_HOST || "exercisedb.p.rapidapi.com";
  const name = String(req.query.name || "").trim();
  const debug = req.query.debug ? { hasKey: Boolean(key), keyLen: key ? key.length : 0, host } : null;
  if (!key || !name) return res.json({ ok: true, gif: null, ...(debug && { debug: { ...debug, reason: !key ? "no EXERCISEDB_KEY" : "no name" } }) });
  const cacheKey = name.toLowerCase();
  if (!req.query.debug && gifCache.has(cacheKey)) return res.json({ ok: true, gif: gifCache.get(cacheKey) });
  // ExerciseDB matches on a name substring; drop parenthetical qualifiers.
  const q = name.replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim().toLowerCase();
  try {
    const r = await fetch(`https://${host}/exercises/name/${encodeURIComponent(q)}?limit=1&offset=0`, {
      headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": host },
    });
    const text = await r.text();
    let data = null;
    try { data = JSON.parse(text); } catch { /* upstream returned non-JSON */ }
    const gif = extractGif(data);
    if (gif) gifCache.set(cacheKey, gif);
    if (debug) return res.json({ ok: true, gif, debug: { ...debug, q, status: r.status, sample: text.slice(0, 500) } });
    res.json({ ok: true, gif });
  } catch (err) {
    if (debug) return res.json({ ok: true, gif: null, debug: { ...debug, error: err.message } });
    console.error("Exercise GIF lookup failed:", err.message);
    res.json({ ok: true, gif: null });
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
  const { title, performedAt, notes, sets, planId, weightUnit } = req.body || {};
  if (!Array.isArray(sets) || sets.length === 0) {
    return res.status(400).json({ ok: false, error: "Add at least one set before saving." });
  }
  const unit = weightUnit === "lb" ? "lb" : "kg";
  const fb = parseFeedback(req.body || {});
  const client = await pool.connect();
  try {
    await client.query("begin");
    const w = await client.query(
      `insert into workouts (user_id, title, performed_at, notes, plan_id, weight_unit, session_feel, session_effort, muscle_intensity)
       values ($1, $2, coalesce($3, now()), $4, $5, $6, $7, $8, $9::jsonb) returning *`,
      [req.user.sub, String(title || "Workout").trim(), performedAt || null, String(notes || "").trim(), planId || null, unit, fb.feel, fb.effort, fb.muscleIntensity]
    );
    const workout = w.rows[0];
    for (const s of sets) {
      await client.query(
        `insert into workout_sets (workout_id, exercise_id, exercise_name, set_number, weight, reps, rir, rpe, weight_unit, note)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          workout.id,
          s.exerciseId || null,
          String(s.exerciseName || "Exercise"),
          Number(s.setNumber) || 1,
          s.weight === "" || s.weight == null ? 0 : Number(s.weight),
          s.reps === "" || s.reps == null ? 0 : Number(s.reps),
          s.rir === "" || s.rir == null ? null : String(s.rir).trim(),
          s.rpe === "" || s.rpe == null ? null : Number(s.rpe),
          s.unit === "lb" ? "lb" : "kg",
          String(s.note || "").trim(),
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
      `select w.id, w.title, w.performed_at, w.notes, w.weight_unit,
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

// ── Update a workout (replace its sets) ──
app.put("/api/workouts/:id", requireUser, async (req, res) => {
  const { title, performedAt, notes, sets, weightUnit } = req.body || {};
  if (!Array.isArray(sets) || sets.length === 0) {
    return res.status(400).json({ ok: false, error: "Add at least one set before saving." });
  }
  const unit = weightUnit === "lb" ? "lb" : "kg";
  const fb = parseFeedback(req.body || {});
  const own = await query(`select id from workouts where id = $1 and user_id = $2`, [req.params.id, req.user.sub]);
  if (!own.rows[0]) return res.status(404).json({ ok: false, error: "Workout not found." });
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `update workouts set title = $1, performed_at = coalesce($2, performed_at), notes = $3, weight_unit = $4,
              session_feel = $6, session_effort = $7, muscle_intensity = $8::jsonb
       where id = $5`,
      [String(title || "Workout").trim(), performedAt || null, String(notes || "").trim(), unit, req.params.id, fb.feel, fb.effort, fb.muscleIntensity]
    );
    await client.query(`delete from workout_sets where workout_id = $1`, [req.params.id]);
    for (const s of sets) {
      await client.query(
        `insert into workout_sets (workout_id, exercise_id, exercise_name, set_number, weight, reps, rir, rpe, weight_unit, note)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          req.params.id, s.exerciseId || null, String(s.exerciseName || "Exercise"), Number(s.setNumber) || 1,
          s.weight === "" || s.weight == null ? 0 : Number(s.weight),
          s.reps === "" || s.reps == null ? 0 : Number(s.reps),
          s.rir === "" || s.rir == null ? null : String(s.rir).trim(),
          s.rpe === "" || s.rpe == null ? null : Number(s.rpe),
          s.unit === "lb" ? "lb" : "kg",
          String(s.note || "").trim(),
        ]
      );
    }
    await client.query("commit");
    res.json({ ok: true });
  } catch (err) {
    await client.query("rollback");
    console.error("Update workout failed:", err);
    res.status(500).json({ ok: false, error: "Could not update the workout." });
  } finally {
    client.release();
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

// ─────────────────────────────────────────────────────────────
// Plans / mesocycles (multiple per user, one active)
// ─────────────────────────────────────────────────────────────
function shapePlan(p, weeks) {
  return {
    id: p.id,
    name: p.name,
    objective: p.objective || "",
    startDate: p.start_date,
    endDate: p.end_date,
    isActive: p.is_active,
    currentWeek: p.current_week || 0,
    nextIndex: p.next_index || 0,
    weeks: weeks || [],
  };
}

// Load a plan as the nested mesocycle → weeks → days → exercises tree.
async function loadPlan(planId, userId) {
  const r = await query(`select * from plans where id = $1 and user_id = $2`, [planId, userId]);
  if (!r.rows[0]) return null;
  const weeks = (await query(`select id, position, name, notes from plan_weeks where plan_id = $1 order by position`, [planId])).rows;
  const weekIds = weeks.map((w) => w.id);
  let days = [];
  let exs = [];
  if (weekIds.length) {
    days = (await query(`select id, week_id, position, name, notes from plan_days where week_id = any($1) order by position`, [weekIds])).rows;
    const dayIds = days.map((d) => d.id);
    if (dayIds.length) {
      exs = (await query(
        `select day_id, position, exercise_id, sets, reps, rir, notes from plan_exercises where day_id = any($1) order by position`,
        [dayIds]
      )).rows;
    }
  }
  const exByDay = {};
  for (const e of exs) {
    (exByDay[e.day_id] = exByDay[e.day_id] || []).push({
      exerciseId: e.exercise_id, sets: e.sets, reps: e.reps || "", rir: e.rir || "", notes: e.notes || "",
    });
  }
  const daysByWeek = {};
  for (const d of days) {
    (daysByWeek[d.week_id] = daysByWeek[d.week_id] || []).push({
      position: d.position, name: d.name, notes: d.notes || "", exercises: exByDay[d.id] || [],
    });
  }
  return shapePlan(
    r.rows[0],
    weeks.map((w) => ({ position: w.position, name: w.name, notes: w.notes || "", days: daysByWeek[w.id] || [] }))
  );
}

// Replace a plan's whole week→day→exercise tree inside an open transaction.
async function writePlanStructure(client, planId, weeks) {
  await client.query(`delete from plan_weeks where plan_id = $1`, [planId]);
  for (let wi = 0; wi < weeks.length; wi++) {
    const w = weeks[wi] || {};
    const wins = await client.query(
      `insert into plan_weeks (plan_id, position, name, notes) values ($1, $2, $3, $4) returning id`,
      [planId, wi, String(w.name || `Week ${wi + 1}`).trim(), String(w.notes || "").trim()]
    );
    const weekId = wins.rows[0].id;
    const days = Array.isArray(w.days) ? w.days : [];
    for (let di = 0; di < days.length; di++) {
      const d = days[di] || {};
      const dins = await client.query(
        `insert into plan_days (plan_id, week_id, position, name, notes) values ($1, $2, $3, $4, $5) returning id`,
        [planId, weekId, di, String(d.name || `Day ${di + 1}`).trim(), String(d.notes || "").trim()]
      );
      const dayId = dins.rows[0].id;
      const exs = Array.isArray(d.exercises) ? d.exercises : [];
      let pos = 0;
      for (const e of exs) {
        if (!e || !e.exerciseId) continue;
        await client.query(
          `insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) values ($1, $2, $3, $4, $5, $6, $7)`,
          [dayId, pos++, e.exerciseId, clampSets(e.sets), String(e.reps || "").trim(), String(e.rir || "").trim(), String(e.notes || "").trim()]
        );
      }
    }
  }
}

// ── List the member's plans ──
app.get("/api/plans", requireUser, async (req, res) => {
  try {
    const { rows } = await query(
      `select p.*, count(distinct w.id)::int as week_count
       from plans p left join plan_weeks w on w.plan_id = p.id
       where p.user_id = $1 group by p.id order by p.is_active desc, p.created_at desc`,
      [req.user.sub]
    );
    res.json({
      ok: true,
      plans: rows.map((p) => ({
        id: p.id, name: p.name, objective: p.objective || "",
        startDate: p.start_date, endDate: p.end_date, isActive: p.is_active, weekCount: p.week_count,
      })),
    });
  } catch (err) {
    console.error("List plans failed:", err);
    res.status(500).json({ ok: false, error: "Could not load your plans." });
  }
});

// ── The active plan (drives the dashboard "up next") ──
app.get("/api/plans/active", requireUser, async (req, res) => {
  try {
    const r = await query(`select id from plans where user_id = $1 and is_active = true limit 1`, [req.user.sub]);
    if (!r.rows[0]) return res.json({ ok: true, plan: null });
    const plan = await loadPlan(r.rows[0].id, req.user.sub);
    res.json({ ok: true, plan });
  } catch (err) {
    console.error("Active plan failed:", err);
    res.status(500).json({ ok: false, error: "Could not load your active plan." });
  }
});

// ── A single plan with its full tree ──
app.get("/api/plans/:id", requireUser, async (req, res) => {
  try {
    const plan = await loadPlan(req.params.id, req.user.sub);
    if (!plan) return res.status(404).json({ ok: false, error: "Plan not found." });
    res.json({ ok: true, plan });
  } catch (err) {
    console.error("Get plan failed:", err);
    res.status(500).json({ ok: false, error: "Could not load the plan." });
  }
});

// ── Create a plan (first plan becomes active automatically) ──
app.post("/api/plans", requireUser, async (req, res) => {
  const { name, objective, startDate, endDate, weeks } = req.body || {};
  const client = await pool.connect();
  try {
    await client.query("begin");
    const count = await client.query(`select count(*)::int as n from plans where user_id = $1`, [req.user.sub]);
    const makeActive = count.rows[0].n === 0;
    const ins = await client.query(
      `insert into plans (user_id, name, objective, weeks, start_date, end_date, is_active)
       values ($1, $2, $3, $4, $5, $6, $7) returning id`,
      [req.user.sub, String(name || "My Plan").trim(), String(objective || "").trim(), Array.isArray(weeks) ? weeks.length : 0, startDate || null, endDate || null, makeActive]
    );
    await writePlanStructure(client, ins.rows[0].id, Array.isArray(weeks) ? weeks : []);
    await client.query("commit");
    res.json({ ok: true, plan: await loadPlan(ins.rows[0].id, req.user.sub) });
  } catch (err) {
    await client.query("rollback");
    console.error("Create plan failed:", err);
    res.status(500).json({ ok: false, error: "Could not create the plan." });
  } finally {
    client.release();
  }
});

// ── Update a plan (fields + full tree) ──
app.put("/api/plans/:id", requireUser, async (req, res) => {
  const { name, objective, startDate, endDate, weeks } = req.body || {};
  const client = await pool.connect();
  try {
    await client.query("begin");
    const owned = await client.query(`select id from plans where id = $1 and user_id = $2`, [req.params.id, req.user.sub]);
    if (!owned.rows[0]) {
      await client.query("rollback");
      return res.status(404).json({ ok: false, error: "Plan not found." });
    }
    await client.query(
      `update plans set name = $2, objective = $3, weeks = $4, start_date = $5, end_date = $6, current_week = 0, next_index = 0 where id = $1`,
      [req.params.id, String(name || "My Plan").trim(), String(objective || "").trim(), Array.isArray(weeks) ? weeks.length : 0, startDate || null, endDate || null]
    );
    if (Array.isArray(weeks)) await writePlanStructure(client, req.params.id, weeks);
    await client.query("commit");
    res.json({ ok: true, plan: await loadPlan(req.params.id, req.user.sub) });
  } catch (err) {
    await client.query("rollback");
    console.error("Update plan failed:", err);
    res.status(500).json({ ok: false, error: "Could not update the plan." });
  } finally {
    client.release();
  }
});

// ── Make a plan the active one ──
app.post("/api/plans/:id/activate", requireUser, async (req, res) => {
  try {
    const owned = await query(`select id from plans where id = $1 and user_id = $2`, [req.params.id, req.user.sub]);
    if (!owned.rows[0]) return res.status(404).json({ ok: false, error: "Plan not found." });
    await query(`update plans set is_active = (id = $1) where user_id = $2`, [req.params.id, req.user.sub]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Activate plan failed:", err);
    res.status(500).json({ ok: false, error: "Could not activate the plan." });
  }
});

// ── Advance the rotation: next day in the current week, then next week ──
app.post("/api/plans/:id/advance", requireUser, async (req, res) => {
  try {
    const p = await query(`select current_week, next_index from plans where id = $1 and user_id = $2`, [req.params.id, req.user.sub]);
    if (!p.rows[0]) return res.json({ ok: true });
    const weeks = (await query(`select id from plan_weeks where plan_id = $1 order by position`, [req.params.id])).rows;
    if (!weeks.length) return res.json({ ok: true });
    let cw = ((p.rows[0].current_week % weeks.length) + weeks.length) % weeks.length;
    const dayCount = (await query(`select count(*)::int as n from plan_days where week_id = $1`, [weeks[cw].id])).rows[0].n;
    let ni = (p.rows[0].next_index || 0) + 1;
    if (dayCount === 0 || ni >= dayCount) { ni = 0; cw = (cw + 1) % weeks.length; }
    await query(`update plans set current_week = $2, next_index = $3 where id = $1`, [req.params.id, cw, ni]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Advance plan failed:", err);
    res.status(500).json({ ok: false, error: "Could not advance the plan." });
  }
});

// ── Delete a plan ──
app.delete("/api/plans/:id", requireUser, async (req, res) => {
  try {
    await query(`delete from plans where id = $1 and user_id = $2`, [req.params.id, req.user.sub]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete plan failed:", err);
    res.status(500).json({ ok: false, error: "Could not delete the plan." });
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

// ── Imported progress baseline (e.g. Hipertrofit snapshot) ──
app.get("/api/progress-baseline", requireUser, async (req, res) => {
  try {
    const { rows } = await query(
      `select exercise_name, muscle_group, evolution_pct::float as evolution_pct,
              vol_max::float as vol_max, vol_current::float as vol_current, source
       from progress_baseline where user_id = $1 order by exercise_name`,
      [req.user.sub]
    );
    res.json({ ok: true, baseline: rows });
  } catch (err) {
    console.error("Progress baseline failed:", err);
    res.status(500).json({ ok: false, error: "Could not load your progress baseline." });
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

// ─────────────────────────────────────────────────────────────
// Coach / admin oversight of members (full control)
// ─────────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.admin || req.admin.role !== "admin") {
      return res.status(403).json({ ok: false, error: "Admin only." });
    }
    next();
  });
}

// List members with quick stats
app.get("/api/admin/members", requireAdmin, async (req, res) => {
  try {
    const { rows } = await query(
      `select u.id, u.name, u.email, u.created_at, u.status,
              count(distinct w.id)::int as workout_count,
              max(w.performed_at) as last_workout
       from users u left join workouts w on w.user_id = u.id
       group by u.id order by u.created_at desc`
    );
    res.json({ ok: true, members: rows });
  } catch (err) {
    console.error("Admin members failed:", err);
    res.status(500).json({ ok: false, error: "Could not load members." });
  }
});

// Approve a pending member (they can now log in)
app.post("/api/admin/members/:id/approve", requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await query(`update users set status = 'approved' where id = $1`, [req.params.id]);
    if (!rowCount) return res.status(404).json({ ok: false, error: "Member not found." });
    res.json({ ok: true });
  } catch (err) {
    console.error("Approve member failed:", err);
    res.status(500).json({ ok: false, error: "Could not approve the member." });
  }
});

// Reject / revoke a member (keeps their data; they can no longer log in)
app.post("/api/admin/members/:id/reject", requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await query(`update users set status = 'rejected' where id = $1`, [req.params.id]);
    if (!rowCount) return res.status(404).json({ ok: false, error: "Member not found." });
    res.json({ ok: true });
  } catch (err) {
    console.error("Reject member failed:", err);
    res.status(500).json({ ok: false, error: "Could not update the member." });
  }
});

// Invite / create a member directly (approved immediately). The coach shares
// the temporary password with the member; there is no email involved.
app.post("/api/admin/members", requireAdmin, async (req, res) => {
  if (!dbEnabled) return res.status(503).json({ ok: false, error: "The member area is not configured on the server." });
  const { name, email, password } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ ok: false, error: "Please enter a name." });
  if (!isValidEmail(email)) return res.status(400).json({ ok: false, error: "Please enter a valid email." });
  if (!isStrongEnough(password)) return res.status(400).json({ ok: false, error: "Password must be at least 6 characters." });
  try {
    const exists = await query(`select 1 from users where email = $1`, [String(email).trim().toLowerCase()]);
    if (exists.rows[0]) return res.status(409).json({ ok: false, error: "An account with this email already exists." });
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `insert into users (name, email, password_hash, status) values ($1, $2, $3, 'approved') returning id, name, email`,
      [String(name).trim(), String(email).trim().toLowerCase(), hash]
    );
    res.json({ ok: true, member: rows[0] });
  } catch (err) {
    console.error("Create member failed:", err);
    res.status(500).json({ ok: false, error: "Could not create the member." });
  }
});

// One member: profile + workouts + plans
app.get("/api/admin/members/:id", requireAdmin, async (req, res) => {
  try {
    const u = await query(`select id, name, email, created_at from users where id = $1`, [req.params.id]);
    if (!u.rows[0]) return res.status(404).json({ ok: false, error: "Member not found." });
    const workouts = await query(
      `select w.id, w.title, w.performed_at, w.notes, w.weight_unit,
              count(s.id)::int as set_count, count(distinct s.exercise_name)::int as exercise_count
       from workouts w left join workout_sets s on s.workout_id = w.id
       where w.user_id = $1 group by w.id order by w.performed_at desc`,
      [req.params.id]
    );
    const plans = await query(
      `select p.id, p.name, p.objective, p.is_active, count(distinct wk.id)::int as week_count
       from plans p left join plan_weeks wk on wk.plan_id = p.id
       where p.user_id = $1 group by p.id order by p.is_active desc, p.created_at desc`,
      [req.params.id]
    );
    res.json({ ok: true, member: u.rows[0], workouts: workouts.rows, plans: plans.rows });
  } catch (err) {
    console.error("Admin member failed:", err);
    res.status(500).json({ ok: false, error: "Could not load the member." });
  }
});

// A member's workout with its sets
app.get("/api/admin/workouts/:id", requireAdmin, async (req, res) => {
  try {
    const w = await query(`select * from workouts where id = $1`, [req.params.id]);
    if (!w.rows[0]) return res.status(404).json({ ok: false, error: "Workout not found." });
    const s = await query(`select * from workout_sets where workout_id = $1 order by set_number`, [req.params.id]);
    res.json({ ok: true, workout: w.rows[0], sets: s.rows });
  } catch (err) {
    console.error("Admin workout failed:", err);
    res.status(500).json({ ok: false, error: "Could not load the workout." });
  }
});

// Edit a member's workout (title / date / notes / unit)
app.put("/api/admin/workouts/:id", requireAdmin, async (req, res) => {
  const { title, performedAt, notes, weightUnit } = req.body || {};
  try {
    const r = await query(
      `update workouts set title = $2, performed_at = coalesce($3, performed_at), notes = $4, weight_unit = $5 where id = $1 returning id`,
      [req.params.id, String(title || "Workout").trim(), performedAt || null, String(notes || "").trim(), weightUnit === "lb" ? "lb" : "kg"]
    );
    if (!r.rows[0]) return res.status(404).json({ ok: false, error: "Workout not found." });
    res.json({ ok: true });
  } catch (err) {
    console.error("Admin update workout failed:", err);
    res.status(500).json({ ok: false, error: "Could not update the workout." });
  }
});

// Delete a member's workout
app.delete("/api/admin/workouts/:id", requireAdmin, async (req, res) => {
  try {
    await query(`delete from workouts where id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Admin delete workout failed:", err);
    res.status(500).json({ ok: false, error: "Could not delete the workout." });
  }
});

// Edit a single set
app.put("/api/admin/sets/:id", requireAdmin, async (req, res) => {
  const { weight, reps, rir } = req.body || {};
  try {
    const r = await query(
      `update workout_sets set weight = $2, reps = $3, rir = $4 where id = $1 returning id`,
      [
        req.params.id,
        weight === "" || weight == null ? 0 : Number(weight),
        reps === "" || reps == null ? 0 : Number(reps),
        rir === "" || rir == null ? null : String(rir).trim(),
      ]
    );
    if (!r.rows[0]) return res.status(404).json({ ok: false, error: "Set not found." });
    res.json({ ok: true });
  } catch (err) {
    console.error("Admin update set failed:", err);
    res.status(500).json({ ok: false, error: "Could not update the set." });
  }
});

// Delete a single set
app.delete("/api/admin/sets/:id", requireAdmin, async (req, res) => {
  try {
    await query(`delete from workout_sets where id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Admin delete set failed:", err);
    res.status(500).json({ ok: false, error: "Could not delete the set." });
  }
});

// Exercises available to a member (shared defaults + their own) — for the plan editor
app.get("/api/admin/members/:id/exercises", requireAdmin, async (req, res) => {
  try {
    const { rows } = await query(
      `select id, name, muscle_group, equipment, media_url, instructions
       from exercises where owner_id is null or owner_id = $1 order by name`,
      [req.params.id]
    );
    res.json({ ok: true, exercises: rows });
  } catch (err) {
    console.error("Admin member exercises failed:", err);
    res.status(500).json({ ok: false, error: "Could not load exercises." });
  }
});

// A member's progress for one exercise (coach view)
app.get("/api/admin/members/:id/progress/:exerciseId", requireAdmin, async (req, res) => {
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
      [req.params.id, req.params.exerciseId]
    );
    res.json({ ok: true, points: rows });
  } catch (err) {
    console.error("Admin member progress failed:", err);
    res.status(500).json({ ok: false, error: "Could not load progress." });
  }
});

// A member's imported progress baseline (coach view)
app.get("/api/admin/members/:id/progress-baseline", requireAdmin, async (req, res) => {
  try {
    const { rows } = await query(
      `select exercise_name, muscle_group, evolution_pct::float as evolution_pct,
              vol_max::float as vol_max, vol_current::float as vol_current, source
       from progress_baseline where user_id = $1 order by exercise_name`,
      [req.params.id]
    );
    res.json({ ok: true, baseline: rows });
  } catch (err) {
    console.error("Admin member baseline failed:", err);
    res.status(500).json({ ok: false, error: "Could not load progress baseline." });
  }
});

// A member's daily nutrition summary (coach view): totals per day.
app.get("/api/admin/members/:id/nutrition", requireAdmin, async (req, res) => {
  try {
    const { rows } = await query(
      `select to_char(logged_on, 'YYYY-MM-DD') as date,
              sum(calories)::float as calories, sum(protein)::float as protein,
              sum(carbs)::float as carbs, sum(fat)::float as fat, count(*)::int as items
       from nutrition_logs where user_id = $1
       group by logged_on order by logged_on desc limit 30`,
      [req.params.id]
    );
    res.json({ ok: true, days: rows });
  } catch (err) {
    console.error("Admin member nutrition failed:", err);
    res.status(500).json({ ok: false, error: "Could not load nutrition." });
  }
});

// A member's logged foods for one day (coach view).
app.get("/api/admin/members/:id/nutrition/:date", requireAdmin, async (req, res) => {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(req.params.date) ? req.params.date : null;
  if (!day) return res.status(400).json({ ok: false, error: "Invalid date." });
  try {
    const { rows } = await query(
      `select id, meal, food_name, serving, quantity, calories, protein, carbs, fat
       from nutrition_logs where user_id = $1 and logged_on = $2::date order by created_at`,
      [req.params.id, day]
    );
    res.json({ ok: true, entries: rows });
  } catch (err) {
    console.error("Admin member nutrition day failed:", err);
    res.status(500).json({ ok: false, error: "Could not load the day's foods." });
  }
});

// Read a member's daily nutrition goals (coach view).
app.get("/api/admin/members/:id/nutrition-goals", requireAdmin, async (req, res) => {
  try {
    const { rows } = await query(
      `select calories::float, protein::float, carbs::float, fat::float from nutrition_goals where user_id = $1`,
      [req.params.id]
    );
    res.json({ ok: true, goals: rows[0] || null });
  } catch (err) {
    console.error("Admin nutrition goals fetch failed:", err);
    res.status(500).json({ ok: false, error: "Could not load goals." });
  }
});

// Set a member's daily nutrition goals (coach).
app.put("/api/admin/members/:id/nutrition-goals", requireAdmin, async (req, res) => {
  const { calories, protein, carbs, fat } = req.body || {};
  const n = (v) => Math.max(0, Number(v) || 0);
  try {
    await query(
      `insert into nutrition_goals (user_id, calories, protein, carbs, fat, updated_at)
       values ($1, $2, $3, $4, $5, now())
       on conflict (user_id) do update set calories = $2, protein = $3, carbs = $4, fat = $5, updated_at = now()`,
      [req.params.id, n(calories), n(protein), n(carbs), n(fat)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("Admin nutrition goals save failed:", err);
    res.status(500).json({ ok: false, error: "Could not save goals." });
  }
});

// A member's full nutrition log (for Excel export).
app.get("/api/admin/members/:id/nutrition-all", requireAdmin, async (req, res) => {
  try {
    const { rows } = await query(
      `select to_char(logged_on, 'YYYY-MM-DD') as date, meal, food_name, serving,
              quantity, calories, protein, carbs, fat
       from nutrition_logs where user_id = $1 order by logged_on desc, created_at`,
      [req.params.id]
    );
    res.json({ ok: true, rows });
  } catch (err) {
    console.error("Admin member nutrition export failed:", err);
    res.status(500).json({ ok: false, error: "Could not export nutrition." });
  }
});

// Load a member's plan (full tree)
app.get("/api/admin/plans/:id", requireAdmin, async (req, res) => {
  try {
    const o = await query(`select user_id from plans where id = $1`, [req.params.id]);
    if (!o.rows[0]) return res.status(404).json({ ok: false, error: "Plan not found." });
    res.json({ ok: true, plan: await loadPlan(req.params.id, o.rows[0].user_id) });
  } catch (err) {
    console.error("Admin load plan failed:", err);
    res.status(500).json({ ok: false, error: "Could not load the plan." });
  }
});

// Create a plan for a member
app.post("/api/admin/members/:id/plans", requireAdmin, async (req, res) => {
  const { name, objective, startDate, endDate, weeks } = req.body || {};
  const client = await pool.connect();
  try {
    await client.query("begin");
    const cnt = await client.query(`select count(*)::int as n from plans where user_id = $1`, [req.params.id]);
    const ins = await client.query(
      `insert into plans (user_id, name, objective, weeks, start_date, end_date, is_active)
       values ($1, $2, $3, $4, $5, $6, $7) returning id`,
      [req.params.id, String(name || "Plan").trim(), String(objective || "").trim(), Array.isArray(weeks) ? weeks.length : 0, startDate || null, endDate || null, cnt.rows[0].n === 0]
    );
    await writePlanStructure(client, ins.rows[0].id, Array.isArray(weeks) ? weeks : []);
    await client.query("commit");
    res.json({ ok: true, plan: await loadPlan(ins.rows[0].id, req.params.id) });
  } catch (err) {
    await client.query("rollback");
    console.error("Admin create plan failed:", err);
    res.status(500).json({ ok: false, error: "Could not create the plan." });
  } finally {
    client.release();
  }
});

// Update a member's plan
app.put("/api/admin/plans/:id", requireAdmin, async (req, res) => {
  const { name, objective, startDate, endDate, weeks } = req.body || {};
  const o = await query(`select user_id from plans where id = $1`, [req.params.id]);
  if (!o.rows[0]) return res.status(404).json({ ok: false, error: "Plan not found." });
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `update plans set name = $2, objective = $3, weeks = $4, start_date = $5, end_date = $6 where id = $1`,
      [req.params.id, String(name || "Plan").trim(), String(objective || "").trim(), Array.isArray(weeks) ? weeks.length : 0, startDate || null, endDate || null]
    );
    if (Array.isArray(weeks)) await writePlanStructure(client, req.params.id, weeks);
    await client.query("commit");
    res.json({ ok: true, plan: await loadPlan(req.params.id, o.rows[0].user_id) });
  } catch (err) {
    await client.query("rollback");
    console.error("Admin update plan failed:", err);
    res.status(500).json({ ok: false, error: "Could not update the plan." });
  } finally {
    client.release();
  }
});

// Make a member's plan the active one
app.post("/api/admin/plans/:id/activate", requireAdmin, async (req, res) => {
  try {
    const o = await query(`select user_id from plans where id = $1`, [req.params.id]);
    if (!o.rows[0]) return res.status(404).json({ ok: false, error: "Plan not found." });
    await query(`update plans set is_active = (id = $1) where user_id = $2`, [req.params.id, o.rows[0].user_id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Admin activate plan failed:", err);
    res.status(500).json({ ok: false, error: "Could not activate the plan." });
  }
});

// Duplicate a plan to another member (copies the full tree; ensures the
// referenced exercises exist in the target's catalog by name).
app.post("/api/admin/plans/:id/duplicate", requireAdmin, async (req, res) => {
  const targetId = (req.body || {}).targetMemberId;
  if (!targetId) return res.status(400).json({ ok: false, error: "Pick a member to copy to." });
  const client = await pool.connect();
  try {
    const src = await client.query(`select * from plans where id = $1`, [req.params.id]);
    if (!src.rows[0]) return res.status(404).json({ ok: false, error: "Plan not found." });
    const tgt = await client.query(`select id from users where id = $1`, [targetId]);
    if (!tgt.rows[0]) return res.status(404).json({ ok: false, error: "Member not found." });

    const rows = (await client.query(
      `select wk.position as wpos, wk.name as wname, wk.notes as wnotes,
              d.position as dpos, d.name as dname, d.notes as dnotes,
              pe.position as epos, e.name as ename, e.muscle_group as egrp,
              pe.sets, pe.reps, pe.rir, pe.notes as enotes
       from plan_weeks wk
       join plan_days d on d.week_id = wk.id
       left join plan_exercises pe on pe.day_id = d.id
       left join exercises e on e.id = pe.exercise_id
       where wk.plan_id = $1
       order by wk.position, d.position, pe.position`,
      [req.params.id]
    )).rows;

    await client.query("begin");
    // Ensure each exercise exists for the target (visible = owned by target or shared).
    const names = [...new Set(rows.filter((r) => r.ename).map((r) => r.ename))];
    const nameToId = {};
    if (names.length) {
      const ex = await client.query(
        `select id, name from exercises where (owner_id is null or owner_id = $1) and name = any($2)`,
        [targetId, names]
      );
      ex.rows.forEach((e) => (nameToId[e.name.toLowerCase()] = e.id));
      for (const r of rows) {
        if (r.ename && !nameToId[r.ename.toLowerCase()]) {
          const ins = await client.query(
            `insert into exercises (owner_id, name, muscle_group) values ($1, $2, $3) returning id`,
            [targetId, r.ename, r.egrp || ""]
          );
          nameToId[r.ename.toLowerCase()] = ins.rows[0].id;
        }
      }
    }
    // Rebuild the nested weeks structure with target exercise ids.
    const wMap = new Map();
    for (const r of rows) {
      if (!wMap.has(r.wpos)) wMap.set(r.wpos, { name: r.wname, notes: r.wnotes || "", days: new Map() });
      const wk = wMap.get(r.wpos);
      if (!wk.days.has(r.dpos)) wk.days.set(r.dpos, { name: r.dname, notes: r.dnotes || "", exercises: [] });
      if (r.ename) {
        wk.days.get(r.dpos).exercises.push({
          exerciseId: nameToId[r.ename.toLowerCase()], sets: r.sets, reps: r.reps || "", rir: r.rir || "", notes: r.enotes || "",
        });
      }
    }
    const weeks = [...wMap.entries()].sort((a, b) => a[0] - b[0]).map(([, w]) => ({
      name: w.name, notes: w.notes,
      days: [...w.days.entries()].sort((a, b) => a[0] - b[0]).map(([, d]) => d),
    }));

    const cnt = await client.query(`select count(*)::int as n from plans where user_id = $1`, [targetId]);
    const insP = await client.query(
      `insert into plans (user_id, name, objective, weeks, start_date, end_date, is_active)
       values ($1, $2, $3, $4, $5, $6, $7) returning id`,
      [targetId, src.rows[0].name, src.rows[0].objective || "", weeks.length, src.rows[0].start_date || null, src.rows[0].end_date || null, cnt.rows[0].n === 0]
    );
    await writePlanStructure(client, insP.rows[0].id, weeks);
    await client.query("commit");
    res.json({ ok: true });
  } catch (err) {
    await client.query("rollback");
    console.error("Admin duplicate plan failed:", err);
    res.status(500).json({ ok: false, error: "Could not duplicate the plan." });
  } finally {
    client.release();
  }
});

// Delete a member's plan
app.delete("/api/admin/plans/:id", requireAdmin, async (req, res) => {
  try {
    await query(`delete from plans where id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Admin delete plan failed:", err);
    res.status(500).json({ ok: false, error: "Could not delete the plan." });
  }
});

// ── Nutrition integration (FatSecret Platform API) ──
// Food search + nutrition lookups via FatSecret, plus a per-user food log.
// Configure with FATSECRET_CLIENT_ID + FATSECRET_CLIENT_SECRET (free account at
// platform.fatsecret.com). The server calls FatSecret with a cached OAuth2
// client-credentials token so the secret never reaches the browser.
// Note: FatSecret may require whitelisting this server's outbound IP in their
// dashboard (or turning IP restriction off) for the calls to succeed.
const FS_CLIENT_ID = process.env.FATSECRET_CLIENT_ID;
const FS_CLIENT_SECRET = process.env.FATSECRET_CLIENT_SECRET;
const fatsecretEnabled = Boolean(FS_CLIENT_ID && FS_CLIENT_SECRET);

let fsToken = null; // { access_token, expiresAt }
async function fatsecretToken() {
  if (fsToken && fsToken.expiresAt > Date.now() + 60_000) return fsToken.access_token;
  const auth = Buffer.from(`${FS_CLIENT_ID}:${FS_CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${auth}` },
    body: "grant_type=client_credentials&scope=basic",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`token ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  fsToken = { access_token: data.access_token, expiresAt: Date.now() + (Number(data.expires_in) || 86400) * 1000 };
  return fsToken.access_token;
}

async function fatsecretCall(params) {
  const token = await fatsecretToken();
  const url = new URL("https://platform.fatsecret.com/rest/server.api");
  Object.entries({ ...params, format: "json" }).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* non-JSON error body */ }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  // FatSecret often returns 200 with an { error: { code, message } } payload.
  if (data?.error) throw new Error(`FatSecret ${data.error.code}: ${data.error.message}`);
  return data;
}

// Diagnostic (no secrets exposed): reports the server's outbound IP — which is
// what you whitelist in FatSecret's "IP Restrictions" — and whether the token
// and a sample search succeed. Open /api/nutrition/health in a browser.
app.get("/api/nutrition/health", async (req, res) => {
  const out = { configured: fatsecretEnabled };
  try {
    const ip = await fetch("https://api.ipify.org?format=json").then((r) => r.json());
    out.outboundIp = ip.ip;
  } catch {
    out.outboundIp = "unknown";
  }
  if (!fatsecretEnabled) return res.json(out);
  try {
    await fatsecretToken();
    out.token = "ok";
  } catch (e) {
    out.token = "failed";
    out.tokenError = e.message;
    return res.json(out);
  }
  try {
    const data = await fatsecretCall({ method: "foods.search", search_expression: "apple", max_results: 1 });
    out.search = "ok";
    const f = data?.foods?.food;
    out.sample = Array.isArray(f) ? f[0]?.food_name : f?.food_name || null;
  } catch (e) {
    out.search = "failed";
    out.searchError = e.message;
  }
  res.json(out);
});

// Search the FatSecret food database.
app.get("/api/nutrition/search", requireUser, async (req, res) => {
  if (!fatsecretEnabled) return res.status(503).json({ ok: false, error: "Nutrition search is not configured on the server." });
  const q = String(req.query.q || "").trim();
  if (!q) return res.json({ ok: true, foods: [] });
  try {
    const data = await fatsecretCall({ method: "foods.search", search_expression: q, max_results: 20 });
    const raw = data?.foods?.food || [];
    const foods = (Array.isArray(raw) ? raw : [raw]).map((f) => ({
      id: f.food_id,
      name: f.food_name,
      brand: f.brand_name || "",
      description: f.food_description || "",
    }));
    res.json({ ok: true, foods });
  } catch (err) {
    console.error("Nutrition search failed:", err);
    res.status(502).json({ ok: false, error: "Could not search foods right now." });
  }
});

// Get one food's servings (with calories + macros).
app.get("/api/nutrition/food/:id", requireUser, async (req, res) => {
  if (!fatsecretEnabled) return res.status(503).json({ ok: false, error: "Nutrition is not configured on the server." });
  try {
    const data = await fatsecretCall({ method: "food.get.v2", food_id: req.params.id });
    const food = data?.food;
    if (!food) return res.status(404).json({ ok: false, error: "Food not found." });
    let servings = food?.servings?.serving || [];
    servings = Array.isArray(servings) ? servings : [servings];
    res.json({
      ok: true,
      food: {
        id: food.food_id,
        name: food.food_name,
        brand: food.brand_name || "",
        servings: servings.map((s) => ({
          id: s.serving_id,
          description: s.serving_description,
          // Base size of this serving + its unit, so the client can let the
          // member type a custom amount (e.g. 150 g, 2 cups) and scale macros.
          numberOfUnits: Number(s.number_of_units) || 1,
          unit: s.measurement_description || "",
          calories: Number(s.calories) || 0,
          protein: Number(s.protein) || 0,
          carbs: Number(s.carbohydrate) || 0,
          fat: Number(s.fat) || 0,
        })),
      },
    });
  } catch (err) {
    console.error("Nutrition food details failed:", err);
    res.status(502).json({ ok: false, error: "Could not load this food right now." });
  }
});

// List the member's food log for a day (+ daily totals).
app.get("/api/nutrition/log", requireUser, async (req, res) => {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.date || "")) ? req.query.date : null;
  try {
    const { rows } = await query(
      `select id, logged_on, meal, food_name, serving, quantity, calories, protein, carbs, fat
       from nutrition_logs
       where user_id = $1 and ($2::date is null or logged_on = $2::date)
       order by created_at`,
      [req.user.sub, day]
    );
    const totals = rows.reduce(
      (t, r) => ({
        calories: t.calories + Number(r.calories),
        protein: t.protein + Number(r.protein),
        carbs: t.carbs + Number(r.carbs),
        fat: t.fat + Number(r.fat),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    res.json({ ok: true, entries: rows, totals });
  } catch (err) {
    console.error("Nutrition log fetch failed:", err);
    res.status(500).json({ ok: false, error: "Could not load your food log." });
  }
});

// Add a food entry (calories/macros are the totals for the chosen quantity).
app.post("/api/nutrition/log", requireUser, async (req, res) => {
  const { date, meal, foodName, serving, quantity, calories, protein, carbs, fat, foodId } = req.body || {};
  if (!foodName || !String(foodName).trim()) return res.status(400).json({ ok: false, error: "Missing food." });
  const qty = Number(quantity) > 0 ? Number(quantity) : 1;
  const day = /^\d{4}-\d{2}-\d{2}$/.test(String(date || "")) ? date : null;
  const mealName = String(meal || "breakfast").trim().slice(0, 60) || "breakfast";
  try {
    const { rows } = await query(
      `insert into nutrition_logs (user_id, logged_on, meal, food_name, serving, quantity, calories, protein, carbs, fat, fs_food_id)
       values ($1, coalesce($2::date, current_date), $3, $4, $5, $6, $7, $8, $9, $10, $11)
       returning id, logged_on, meal, food_name, serving, quantity, calories, protein, carbs, fat`,
      [
        req.user.sub, day, mealName, String(foodName).trim(), String(serving || ""), qty,
        Math.max(0, Number(calories) || 0), Math.max(0, Number(protein) || 0),
        Math.max(0, Number(carbs) || 0), Math.max(0, Number(fat) || 0), String(foodId || ""),
      ]
    );
    res.json({ ok: true, entry: rows[0] });
  } catch (err) {
    console.error("Nutrition log add failed:", err);
    res.status(500).json({ ok: false, error: "Could not save the food entry." });
  }
});

// Delete one of the member's food entries.
app.delete("/api/nutrition/log/:id", requireUser, async (req, res) => {
  try {
    await query(`delete from nutrition_logs where id = $1 and user_id = $2`, [req.params.id, req.user.sub]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Nutrition log delete failed:", err);
    res.status(500).json({ ok: false, error: "Could not delete the entry." });
  }
});

// The member's daily nutrition goals (read-only; the coach sets them).
app.get("/api/nutrition/goals", requireUser, async (req, res) => {
  try {
    const { rows } = await query(
      `select calories::float, protein::float, carbs::float, fat::float from nutrition_goals where user_id = $1`,
      [req.user.sub]
    );
    res.json({ ok: true, goals: rows[0] || null });
  } catch (err) {
    console.error("Nutrition goals fetch failed:", err);
    res.status(500).json({ ok: false, error: "Could not load your goals." });
  }
});

// ── Saved meals (reusable templates) ──
// List the member's saved meals with their items.
app.get("/api/nutrition/meals", requireUser, async (req, res) => {
  try {
    const { rows: meals } = await query(
      `select id, name, created_at from saved_meals where user_id = $1 order by created_at desc`,
      [req.user.sub]
    );
    if (meals.length === 0) return res.json({ ok: true, meals: [] });
    const { rows: items } = await query(
      `select saved_meal_id, food_name, serving, quantity, calories, protein, carbs, fat, fs_food_id
       from saved_meal_items where saved_meal_id = any($1)`,
      [meals.map((m) => m.id)]
    );
    const byMeal = {};
    items.forEach((it) => (byMeal[it.saved_meal_id] = byMeal[it.saved_meal_id] || []).push(it));
    res.json({ ok: true, meals: meals.map((m) => ({ ...m, items: byMeal[m.id] || [] })) });
  } catch (err) {
    console.error("Saved meals fetch failed:", err);
    res.status(500).json({ ok: false, error: "Could not load saved meals." });
  }
});

// Save a meal template from a set of food items.
app.post("/api/nutrition/meals", requireUser, async (req, res) => {
  const { name, items } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ ok: false, error: "Please name the meal." });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ ok: false, error: "The meal has no foods." });
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query(
      `insert into saved_meals (user_id, name) values ($1, $2) returning id, name, created_at`,
      [req.user.sub, String(name).trim().slice(0, 80)]
    );
    const meal = rows[0];
    for (const it of items) {
      await client.query(
        `insert into saved_meal_items (saved_meal_id, food_name, serving, quantity, calories, protein, carbs, fat, fs_food_id)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          meal.id, String(it.foodName || it.food_name || "Food"), String(it.serving || ""),
          Number(it.quantity) || 1, Math.max(0, Number(it.calories) || 0), Math.max(0, Number(it.protein) || 0),
          Math.max(0, Number(it.carbs) || 0), Math.max(0, Number(it.fat) || 0), String(it.foodId || it.fs_food_id || ""),
        ]
      );
    }
    await client.query("commit");
    res.json({ ok: true, meal });
  } catch (err) {
    await client.query("rollback");
    console.error("Save meal failed:", err);
    res.status(500).json({ ok: false, error: "Could not save the meal." });
  } finally {
    client.release();
  }
});

// Delete a saved meal template.
app.delete("/api/nutrition/meals/:id", requireUser, async (req, res) => {
  try {
    await query(`delete from saved_meals where id = $1 and user_id = $2`, [req.params.id, req.user.sub]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete saved meal failed:", err);
    res.status(500).json({ ok: false, error: "Could not delete the saved meal." });
  }
});

// ── Weekly check-ins ──
const CHECKIN_COLS = "week_start, weight, neck, waist, abdomen, hips, arm_left, arm_right, leg_left, leg_right, photo, challenges, nutrition_rating, training_rating, stress_level, sleep_level, weight_unit";
function checkinValues(b) {
  const num = (v) => (v === "" || v == null ? null : Number(v));
  const rate = (v) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null; };
  const day = /^\d{4}-\d{2}-\d{2}$/.test(String(b.weekStart || "")) ? b.weekStart : null;
  const unit = b.weightUnit === "lb" ? "lb" : "kg";
  const rawW = num(b.weight);
  const weightKg = rawW == null ? null : (unit === "lb" ? lbToKg(rawW) : rawW); // store canonical kg
  return [
    day, weightKg, num(b.neck), num(b.waist), num(b.abdomen), num(b.hips),
    num(b.armLeft), num(b.armRight), num(b.legLeft), num(b.legRight),
    String(b.photo || "").slice(0, 3000000), String(b.challenges || "").trim(),
    rate(b.nutritionRating), rate(b.trainingRating), rate(b.stressLevel), rate(b.sleepLevel), unit,
  ];
}

// Member: list own recent check-ins.
app.get("/api/checkins", requireUser, async (req, res) => {
  try {
    const { rows } = await query(
      `select id, ${CHECKIN_COLS} from checkins where user_id = $1 order by week_start desc limit 12`,
      [req.user.sub]
    );
    res.json({ ok: true, checkins: rows });
  } catch (err) {
    console.error("Checkins fetch failed:", err);
    res.status(500).json({ ok: false, error: "Could not load your check-ins." });
  }
});

// Member: create or update this week's check-in.
app.post("/api/checkins", requireUser, async (req, res) => {
  const b = req.body || {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(b.weekStart || ""))) {
    return res.status(400).json({ ok: false, error: "Missing week." });
  }
  const vals = checkinValues(b);
  try {
    await query(
      `insert into checkins (user_id, ${CHECKIN_COLS})
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       on conflict (user_id, week_start) do update set
         weight=excluded.weight, neck=excluded.neck, waist=excluded.waist, abdomen=excluded.abdomen, hips=excluded.hips,
         arm_left=excluded.arm_left, arm_right=excluded.arm_right, leg_left=excluded.leg_left, leg_right=excluded.leg_right,
         photo=excluded.photo, challenges=excluded.challenges, nutrition_rating=excluded.nutrition_rating,
         training_rating=excluded.training_rating, stress_level=excluded.stress_level, sleep_level=excluded.sleep_level,
         weight_unit=excluded.weight_unit`,
      [req.user.sub, ...vals]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("Checkin save failed:", err);
    res.status(500).json({ ok: false, error: "Could not save your check-in." });
  }
});

// Admin: a member's check-ins (coach view).
app.get("/api/admin/members/:id/checkins", requireAdmin, async (req, res) => {
  try {
    const { rows } = await query(
      `select id, ${CHECKIN_COLS} from checkins where user_id = $1 order by week_start desc limit 26`,
      [req.params.id]
    );
    res.json({ ok: true, checkins: rows });
  } catch (err) {
    console.error("Admin checkins failed:", err);
    res.status(500).json({ ok: false, error: "Could not load check-ins." });
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

// ── Self-healing schema ──
// The app writes to several columns that were introduced by later SQL
// migrations (session feedback, per-set notes/units, plan link). If one of
// those migrations was never run by hand, saving a workout fails with a
// 500 ("Could not save the workout."). To make deploys robust, we ensure
// those columns exist on startup. Every statement is idempotent, and each
// runs independently so a single failure never blocks the others.
async function ensureSchema() {
  if (!dbEnabled) return;
  const statements = [
    // workouts: plan link, weight unit, and session feedback
    "alter table workouts add column if not exists plan_id uuid",
    "alter table workouts add column if not exists weight_unit text not null default 'kg'",
    "alter table workouts add column if not exists session_feel int",
    "alter table workouts add column if not exists session_effort text default ''",
    "alter table workouts add column if not exists muscle_intensity jsonb default '{}'::jsonb",
    // workout_sets: per-set note, per-set weight unit, and RIR stored as text
    "alter table workout_sets add column if not exists note text default ''",
    "alter table workout_sets add column if not exists weight_unit text not null default 'kg'",
    "alter table workout_sets alter column rir type text using rir::text",
    // users: account gating (default 'approved' so existing members stay in)
    "alter table users add column if not exists status text not null default 'approved'",
  ];
  let ok = 0;
  for (const sql of statements) {
    try {
      await pool.query(sql);
      ok++;
    } catch (err) {
      console.error("⚠️  ensureSchema step skipped:", err.message);
    }
  }
  console.log(`✅ Schema check complete (${ok}/${statements.length} workout columns ensured)`);
}

// Kick off the schema check on boot (non-blocking so the site still serves
// even if the database is momentarily unreachable).
ensureSchema();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(
    transporter
      ? `✉️  Email enabled — applications sent to ${APPLY_TO}`
      : "💾 Email disabled — applications saved to submissions.jsonl (set GMAIL_USER + GMAIL_APP_PASSWORD to enable)"
  );
});
