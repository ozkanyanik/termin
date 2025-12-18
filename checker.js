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

    // 2️⃣ KVKK / onay checkbox
    console.log("☑️ Onay checkbox işaretleniyor...");
    await page.waitForSelector('input[type="checkbox"]');
    await page.check('input[type="checkbox"]');

    // 3️⃣ Weiter
    console.log("➡️ Weiter (1)...");
    await page.click("button.btn_formcontroll_next");

    // 4️⃣ Service seçimi (9_343)
    console.log("🔘 Service seçiliyor (9_343)...");
    await page.waitForSelector("#check_9_343");
    await page.check("#check_9_343", { force: true });

    // 5️⃣ Weiter + termin isteğini yakala
    console.log("📅 Termin endpoint bekleniyor...");
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
