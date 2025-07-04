// ✅ Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

const app = express();

// ✅ Use Render PORT or fallback for local dev
const PORT = process.env.PORT || 5000;

app.set('name', 'BulkMail');
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB using Render env variable
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch((err) => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});

// ✅ Credential model
const Credential = mongoose.model(
  "Credential",
  new mongoose.Schema({
    user: String,
    pass: String,
  }),
  "bulkmail" // your collection name
);

// ✅ Mail transporter (initialized later)
let transporter;

// ✅ Try to load credentials from DB or fallback to .env
Credential.findOne({})
  .then(data => {
    if (data && data.user && data.pass) {
      console.log("✅ Loaded DB credentials:", data);
      transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // STARTTLS
        auth: {
          user: data.user,
          pass: data.pass,
        },
      });
    } else {
      console.warn("⚠️ No DB credentials found, using .env fallback.");
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("❌ No fallback .env credentials found! Exiting.");
        process.exit(1);
      }
      transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // STARTTLS
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    }
  })
  .catch(err => {
    console.error("❌ Error loading DB credentials:", err);
    process.exit(1);
  });

// ✅ Bulk mail route
app.post('/send-bulk-mail', async (req, res) => {
  const { recipients, subject, message } = req.body;

  if (!transporter) {
    return res.status(500).json({ status: "Error", error: "Mail transporter not ready." });
  }

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

// ✅ Start server (IMPORTANT for Render: bind to 0.0.0.0)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ ${app.get('name')} Server started on port ${PORT}`);
});
