const { chromium } = require("playwright");

const BOOKING_URL =
  "https://stuttgart.konsentas.de/form/3/?signup_new=1";

(async () => {
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    locale: "de-DE",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/143 Safari/537.36",
  });

  const page = await context.newPage();

  try {
    // 1️⃣ Sayfayı aç
    console.log("🌐 Sayfa açılıyor...");
    await page.goto(BOOKING_URL, { waitUntil: "domcontentloaded" });

    // 2️⃣ Service seçimi (aria-checked tetiklenir)
    console.log("🔘 Service seçiliyor (check_9_343)...");
    await page.waitForSelector('label[for="check_9_343"]');
    await page.click('label[for="check_9_343"]', { force: true });

    // (opsiyonel doğrulama)
    const ariaChecked = await page.getAttribute(
      'label[for="check_9_343"]',
      "aria-checked"
    );
    console.log("aria-checked =", ariaChecked);

    // 3️⃣ Weiter + termin isteğini yakala
    console.log("➡️ Weiter tıklanıyor, termin isteği bekleniyor...");
    const [terminResponse] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp
            .url()
            .includes("brick_ota_termin_getFirstAvailableTimeslot"),
        { timeout: 30000 }
      ),
      page.click("button.btn_formcontroll_next"),
    ]);

    const terminJson = await terminResponse.json();
    console.log("📡 TERMIN RESPONSE:");
    console.log(JSON.stringify(terminJson, null, 2));
  } catch (err) {
    console.error("🔥 HATA:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
