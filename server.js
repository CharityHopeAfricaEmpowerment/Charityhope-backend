// 🌍 Charity & Hope Africa Empowerment - Backend Complet
// Serveur principal Node.js / Express avec QR Code, Email et MongoDB

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

// ✅ Connexion MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connecté à MongoDB Atlas"))
  .catch((err) => console.error("❌ Erreur MongoDB :", err));

// 📦 Modèle Mongoose
const registrationSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  eventType: String,
  phone: String,
  fileUrl: String,
  ticketCode: String,
  createdAt: { type: Date, default: Date.now },
});
const Registration = mongoose.model("Registration", registrationSchema);

// 📁 Configuration Multer pour upload fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// 📧 Configuration Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 🧾 Route d’inscription principale
app.post("/api/register", upload.single("file"), async (req, res) => {
  try {
    const { fullName, email, eventType, phone } = req.body;
    if (!fullName || !email || !eventType || !phone) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    // Génération code unique (ex: GALA-VIP 233-25)
    const baseCode = eventType.toUpperCase().replace(/\s+/g, "-");
    const randomPart = Math.floor(233 + Math.random() * 100);
    const ticketCode = `${baseCode}-${randomPart}-${new Date().getFullYear()}`;

    // Génération du QR code
    const qrPath = `./uploads/${ticketCode}.png`;
    await QRCode.toFile(qrPath, `Billet: ${ticketCode}`);

    // Sauvegarde en base
    const newReg = new Registration({
      fullName,
      email,
      eventType,
      phone,
      fileUrl: req.file ? req.file.path : null,
      ticketCode,
    });
    await newReg.save();

    // Envoi de l’email
    const mailOptions = {
      from: `"Charity & Hope Africa" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎟️ Confirmation d'inscription - ${eventType}`,
      html: `
        <h2>Bonjour ${fullName},</h2>
        <p>Merci pour votre inscription à <b>${eventType}</b>.</p>
        <p>Votre code de billet : <b>${ticketCode}</b></p>
        <p>Conservez ce code précieusement pour votre accès à l'événement.</p>
        <br>
        <p>Bien à vous,<br><b>Charity & Hope Africa Empowerment</b></p>
      `,
      attachments: [
        {
          filename: `${ticketCode}.png`,
          path: qrPath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: "✅ Inscription réussie. Email envoyé avec QR code.",
      ticketCode,
    });
  } catch (error) {
    console.error("❌ Erreur d’inscription :", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

// 🧾 Route GET pour vérifier le fonctionnement
app.get("/", (req, res) => {
  res.send("🌍 API Charity & Hope Africa opérationnelle !");
});

// 🚀 Lancement du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Serveur Charity & Hope actif sur le port ${PORT}`)
);
