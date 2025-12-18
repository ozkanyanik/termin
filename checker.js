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

  // 1️⃣ Sayfayı aç
  await page.goto(BOOKING_URL, { waitUntil: "domcontentloaded" });

  // 2️⃣ KVKK / onay checkbox (ilk sayfa)
  await page.waitForSelector('input[type="checkbox"]');
  await page.check('input[type="checkbox"]');

  // 3️⃣ Weiter
  await page.click("button.btn_formcontroll_next");

  // 4️⃣ Service seçimi (recno=343)
  console.log("🔘 Service seçiliyor: 9_343");
  await page.waitForSelector("#check_9_343");
  await page.check("#check_9_343", { force: true });

  // 5️⃣ Weiter + termin isteğini
