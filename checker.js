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
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("🌐 Sayfa açılıyor...");
    await page.goto(
      "https://stuttgart.konsentas.de/form/3/?signup_new=1",
      { waitUntil: "networkidle" }
    );

    /* =========================
       SERVICE SELECT (HIDDEN)
    ========================= */
    console.log("🔘 Service seçiliyor (check_9_343)...");

    // Checkbox DOM'da var mı diye bekle (VISIBLE DEĞİL)
    await page.waitForFunction(() =>
      document.getElementById("check_9_343")
    );

    await page.evaluate(() => {
      const cb = document.getElementById("check_9_343");
      if (!cb) throw new Error("Checkbox bulunamadı");

      cb.checked = true;
      cb.setAttribute("aria-checked", "true");
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const ariaChecked = await page.evaluate(() =>
      document.getElementById("check_9_343").getAttribute("aria-checked")
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
      page.evaluate(() => {
        document
          .querySelector("button.btn_formcontroll_next")
          .click();
      }),
    ]);

    const response = await terminResponse.json();

    console.log("📡 TERMIN RESPONSE:");
    console.log(JSON.stringify(response, null, 2));

    /* =========================
       TERMIN KONTROLÜ
    ========================= */
    const termin = response?.data?.termin;
    const code = response?.code;
    if (termin || code === 3) {
      console.log("🎉 TERMIN BULUNDU!");

      await sendMail(
        "🎉 Termin Bulundu!",
        `Stuttgart Führerscheinstelle için termin bulundu!\n\n` +          
          `⏰ Oğuzzzz, hemen siteye gir, termin al!!! \n\n` +
          `👉 https://stuttgart.konsentas.de/form/3/?signup_new=1`
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
