import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { marked } from "marked";
import { dbEnabled, query } from "./db.js";

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

// Where applications are appended when email isn't configured.
const SUBMISSIONS_FILE = path.join(__dirname, "submissions.jsonl");

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Application endpoint ──
app.post("/api/apply", async (req, res) => {
  const { firstName, lastName, email, goal, obstacles, findUs } = req.body || {};

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

// ── Public: list published posts ──
app.get("/api/posts", async (req, res) => {
  if (!dbEnabled) return res.json({ ok: true, posts: [] });
  try {
    const { rows } = await query(
      `select * from posts where published = true order by created_at desc`
    );
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
  const { title, excerpt, coverImage, content, author, published } = req.body || {};
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
      `insert into posts (slug, title, excerpt, cover_image, content, author, published)
       values ($1, $2, $3, $4, $5, $6, $7) returning *`,
      [slug, String(title).trim(), excerpt || "", coverImage || "", content || "", author || "Claudia Bittner", Boolean(published)]
    );
    res.json({ ok: true, post: toPost(rows[0]) });
  } catch (err) {
    console.error("Create post failed:", err);
    res.status(500).json({ ok: false, error: "Could not create the post." });
  }
});

// ── Admin: update a post ──
app.put("/api/admin/posts/:id", requireAuth, async (req, res) => {
  const { title, excerpt, coverImage, content, author, published, slug } = req.body || {};
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
