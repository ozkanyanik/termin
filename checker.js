const { chromium } = require("playwright");
const nodemailer = require("nodemailer");

const BOOKING_URL =
  "https://stuttgart.konsentas.de/form/3/?signup_new=1";

async function sendEmail(data) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Termin Bot" <${process.env.SMTP_USER}>`,
    to: process.env.EMAIL_TO,
    subject: "🎉 Stuttgart – Yeni Termin Bulundu!",
    text: JSON.stringify(data, null, 2),
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    locale: "de-DE",
  });

  const page = await context.newPage();

  console.log("🌐 Bookin
