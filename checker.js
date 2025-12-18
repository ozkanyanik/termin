import { chromium } from "playwright";

/* =========================
   WHATSAPP (TextMeBot)
========================= */
async function sendWhatsApp(message) {
  const phone = process.env.WHATSAPP_PHONE;
  const apikey = process.env.TEXTMEBOT_APIKEY;

  if (!phone || !apikey) {
    console.log("⚠️ WhatsApp ayarları eksik");
    return;
  }

  const url =
    `https://api.textmebot.com/send.php` +
    `?recipient=${phone}` +
    `&apikey=${apikey}` +
    `&text=${encodeURIComponent(message)}`;

  const res = await fetch(url);
  const text = await res.text();

  console.log("📲 WhatsApp response:", text);
}

/* =========================
   MAIN
========================= */
(async () => {
  const browser = await chromium.launch({
    headless: true, // локalde false yapabilirsin
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

    const checkbox = page.locator("#check_9_343");

    await checkbox.waitFor({ state: "attached" });

    const ariaChecked = await checkbox.getAttribute("aria-checked");

    if (ariaChecked !== "true") {
      await page.evaluate(() => {
        const cb = document.getElementById("check_9_343");
        cb.checked = true;
        cb.setAttribute("aria-checked", "true");
        cb.dispatchEvent(new Event("change", { bubbles: true }));
      });
    }

    console.log(
      "aria-checked =",
      await checkbox.getAttribute("aria-checked")
    );

    /* =========================
       WEITER BUTTON
    ========================= */
    console.log("➡️ Weiter tıklanıyor, termin isteği bekleniyor...");

    const [terminResponse] = await Promise.all([
      page.waitForResponse((res) =>
        res.url().includes("brick_ota_termin_getFirstAvailableTimeslot")
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

    if (termin || code !== 3) {
      console.log("🎉 TERMIN BULUNDU!");

      await sendWhatsApp(
        `🎉 TERMIN BULUNDU!\n\n` +
          `Tarih: ${termin.date}\n` +
          `Saat: ${termin.time}\n\n` +
          `👉 https://stuttgart.konsentas.de/form/3/?signup_new=1`
      );
    } else {
      console.log("⏳ Henüz termin yok");
      await sendWhatsApp(
        `🎉 TERMIN YOK !\n\n` +         
          `👉 https://stuttgart.konsentas.de/form/3/?signup_new=1`
      );
    }
  } catch (err) {
    console.error("🔥 HATA:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
