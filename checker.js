const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

// 1️⃣ TOKEN ENDPOINT
const TOKEN_URL =
  "https://stuttgart.konsentas.de/api/getOtaStartUp/?signupform_id=3&userauth=&queryParameter%5Bsignup_new%5D=1&r=";

// 2️⃣ TERMIN ENDPOINT
const TERMIN_URL =
  "https://stuttgart.konsentas.de/api/brick_ota_termin_getFirstAvailableTimeslot";

async function getDynamicToken() {
  const res = await fetch(TOKEN_URL, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const json = await res.json();

  if (!json?.data?.ota_jwt) {
    throw new Error("❌ ota_jwt alınamadı");
  }

  return `Bearer ${json.data.ota_jwt}`;
}

async function checkTermin(token) {
  const res = await fetch(TERMIN_URL, {
    method: "GET",
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: "application/json",
    },
  });

  return res.json();
}

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
    subject: "🎉 Stuttgart Führerscheinstelle – Yeni Termin!",
    text: JSON.stringify(data, null, 2),
  });
}

async function main() {
  console.log("🔐 Token alınıyor...");
  const token = await getDynamicToken();

  console.log("📅 Termin kontrol ediliyor...");
  const result = await checkTermin(token);

  console.log("Response:", result);

  if (result?.data?.termin !== null) {
    console.log("✅ Termin bulundu, email gönderiliyor");
    await sendEmail(result);
  } else {
    console.log("⏳ Termin yok");
  }
}

main().catch((err) => {
  console.error("🔥 HATA:", err.message);
  process.exit(1);
});
