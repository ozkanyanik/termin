const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

const API = "https://stuttgart.konsentas.de/api/brick_ota_termin_getFirstAvailableTimeslot";

const TOKEN = process.env.BEARER_TOKEN;

async function checkAndNotify() {
  const res = await fetch(API, {
    method: "GET",
    headers: {
      Authorization: TOKEN,
      Accept: "application/json",
    },
  });

  const json = await res.json();
  console.log("Response:", json);

  if (json?.data?.termin !== null) {
    await sendEmail(json);
    console.log("✅ Email gönderildi");
  } else {
    console.log("⏳ Termin yok");
  }
}

async function sendEmail(json) {
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
    subject: "🎉 Yeni Termin Bulundu!",
    text: JSON.stringify(json, null, 2),
  });
}

checkAndNotify().catch(console.error);
