import { chromium } from "playwright";
import nodemailer from "nodemailer";

/* =========================
   MAIL (BREVO SMTP)
========================= */
async function sendMail(subject, text) {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    MAIL_TO,
    MAIL_FROM,
  } = process.env;

  if (
    !SMTP_HOST ||
    !SMTP_PORT ||
    !SMTP_USER ||
    !SMTP_PASS ||
    !MAIL_TO ||
    !MAIL_FROM
  ) {
    console.log("⚠️ Mail ayarları eksik");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: MAIL_FROM,
    to: MAIL_TO,
    subject,
    text,
  });

  console.log("📧 Email gönderildi");
}

/* =========================
   MAIN
========================= */
(async () => {
  const browser = await chromium.launch({
    headless: true, // lokal debug için false yapabilirsin
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  });

  const page = await context.newPage();

  try {
    console.log("🌐 Sayfa açılıyor...");
    await page.goto(
      "https://stuttgart.konsentas.de/form/3/?signup_new=1",
      { waitUntil: "networkidle" }
    );

    /* =========================
       SERVICE CHECKBOX
    ========================= */
    console.log("🔘 Service seçiliyor (check_9_343)...");

    await page.waitForSelector("#check_9_343", { timeout: 30000 });

    await page.evaluate(() => {
      const cb = document.getElementById("check_9_343");
      if (cb && !cb.checked) {
        cb.checked = true;
        cb.setAttribute("aria-checked", "true");
        cb.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    const ariaChecked = await page.getAttribute(
      "#check_9_343",
      "aria-checked"
    );
    console.log("aria-checked =", ariaChecked);

    /* =========================
       WEITER + TERMIN REQUEST
    ========================= */
    console.log("➡️ Weiter tıklanıyor, termin isteği bekleniyor...");

    const [terminResponse] = await Promise.all([
      page.waitForResponse((res) =>
        res.url().includes(
          "brick_ota_termin_getFirstAvailableTimeslot"
        )
      ),
      page.click("button.btn_formcontroll_next"),
    ]);

    const response = await terminResponse.json();

    console.log("📡 TERMIN RESPONSE:");
    console.log(JSON.stringify(response, null, 2));

    /* =========================
       TERMIN KONTROLÜ
    ========================= */
    const termin = response?.data?.termin;
    const code = response?.code;

    if (termin || code == 3) {
      console.log("🎉 TERMIN BULUNDU!");

      await sendMail(
        "🎉 Termin Bulundu!",
        `Stuttgart Führerscheinstelle için termin bulundu!\n\n` +
          `📅 Tarih: ${termin.date}\n` +
          `⏰ Saat: ${termin.time}\n\n` +
          `👉 Hemen gir:\n` +
          `https://stuttgart.konsentas.de/form/3/?signup_new=1`
      );
    } else {
      console.log("⏳ Henüz termin yok");
    }
  } catch (err) {
    console.error("🔥 HATA:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
