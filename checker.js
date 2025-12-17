import fetch from "node-fetch";
import nodemailer from "nodemailer";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("config.json", "utf8"));

const API = "https://stuttgart.konsentas.de/api/brick_ota_termin_getFirstAvailableTimeslot";
const TOKEN = config.TOKEN;

async function checkAndNotify() {
  const res = await fetch(API, {
    method: "GET",
    headers: {
      "Authorization": TOKEN,
      "Accept": "application/json"
    }
  });

  const json = await res.json();
  console.log("Response:", json);

  if (json.data?.termin) {
    await sendEmail(json);
    console.log("Email gönderildi!");
  } else {
    console.log("Termin null, email gönderilmedi.");
  }
}

async function sendEmail(json) {
  const transporter = nodemailer.createTransport({
    host: config.EMAIL.SMTP_HOST,
    port: config.EMAIL.SMTP_PORT,
    secure: false,
    auth: {
      user: config.EMAIL.USER,
      pass: config.EMAIL.PASS
    }
  });

  const info = await transporter.sendMail({
    from: `"Termin Bot" <${config.EMAIL.USER}>`,
    to: config.EMAIL.TO,
    subject: "Yeni Termin Bulundu!",
    text: JSON.stringify(json, null, 2)
  });

  console.log("Message sent:", info.messageId);
}

checkAndNotify().catch(console.error);
