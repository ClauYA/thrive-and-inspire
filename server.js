import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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
        from: `"Thrive & Inspire" <${mailFrom}>`,
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
        from: `"Thrive & Inspire" <${mailFrom}>`,
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
        from: `"Thrive & Inspire" <${mailFrom}>`,
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
