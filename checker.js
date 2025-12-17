const { chromium } = require("playwright");
const nodemailer = require("nodemailer");

const BOOKING_URL =
  "https://stuttgart.konsentas.de/form/3/?signup_new=1";

const STARTUP_URL =
  "https://stuttgart.konsentas.de/api/getOtaStartUp/?signupform_id=3&userauth=&queryParameter%5Bsignup_new%5D=1&r=";

const TERMIN_URL =
  "https://stuttgart.konsentas.de/api/brick_ota_termin_getFirstAvailableTimeslot";

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
    subject: "🎉 Stuttgart Führerscheinstelle – Termin Var!",
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

  // 1️⃣ GERÇEK booking sayfası
  console.log("🌐 Booking sayfası açılıyor:", BOOKING_URL);
  await page.goto(BOOKING_URL, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});

  // 2️⃣ Token
  console.log("🔐 Token alınıyor...");
  const tokenRes = await context.request.get(STARTUP_URL);
  const tokenJson = await tokenRes.json();

  const jwt = tokenJson?.data?.ota_jwt;
  if (!jwt) {
    throw new Error("ota_jwt alınamadı");
  }
  const bearer = `Bearer ${jwt}`;

  // 3️⃣ Termin
  console.log("📅 Termin kontrol ediliyor...");
  const terminRes = await context.request.get(TERMIN_URL, {
    headers: {
      Authorization: bearer,
      Accept: "application/json",
    },
  });
  const terminJson = await terminRes.json();
  console.log("Response:", terminJson);

  // 🚫 233 → asla email
  const terminVar =
    terminJson?.code === 3 &&
    terminJson?.data &&
    terminJson.data.termin !== null;

  if (terminVar) {
    console.log("✅ GERÇEK termin bulundu");
    await sendEmail(terminJson);
  } else {
    console.log(
      `⏳ Termin yok | code=${terminJson?.code} msg=${terminJson?.msg}`
    );
  }

  await browser.close();
})().catch((err) => {
  console.error("🔥 HATA:", err);
  process.exit(1);
});
