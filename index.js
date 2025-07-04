// ✅ Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

// ✅ Use Render PORT or fallback for local dev
const PORT = process.env.PORT || 5000;

app.set('name', 'BulkMail');
app.use(cors());
app.use(express.json());

// ✅ Mail transporter: always use .env
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("❌ No .env credentials found! Exiting.");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Bulk mail route
app.post('/send-bulk-mail', async (req, res) => {
  const { recipients, subject, message } = req.body;

  if (!recipients || recipients.length === 0) {
    return res.status(400).json({ status: "Error", error: "No recipients provided." });
  }

  try {
    const info = await transporter.sendMail({
      from: transporter.options.auth.user,
      to: transporter.options.auth.user, // sender
      bcc: recipients, // list of real recipients
      subject,
      text: message,
    });

    console.log("✅ Mail sent:", info);
    res.json({ status: "Success", info });

  } catch (error) {
    console.error("❌ Send error:", error);
    res.status(500).json({ status: "Error", error: error.toString() });
  }
});

// ✅ Test route
app.get('/', (req, res) => {
  res.send(`🚀 ${app.get('name')} Backend is Running on Render!`);
});

// ✅ Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ ${app.get('name')} Server started on port ${PORT}`);
});
