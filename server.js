// 🌍 Charity & Hope Africa Empowerment - Backend Complet
// Gestion des inscriptions, emails et QR codes

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import fs from "fs";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// 🗃️ Connexion à MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connecté à MongoDB Atlas"))
  .catch((err) => console.error("❌ Erreur MongoDB:", err));

// 📦 Modèle de données pour une inscription
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

// 🗂️ Configuration pour upload de fichiers (PDF, images…)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// 📩 Fonction d’envoi d’email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // ton email ex: donatecharityhopeafrica@gmail.com
    pass: process.env.EMAIL_PASS, // ton mot de passe d’application Gmail
  },
});

// 🚦 Route test
app.get("/", (req, res) => {
  res.send("✅ Serveur Charity & Hope Africa opérationnel 🌍");
});

// 🧾 Route d’inscription + génération du QR code + email
app.post("/api/register", upload.single("file"), async (req, res) => {
  try {
    const { fullName, email, eventType, phone } = req.body;

    // Génération du code unique (par exemple : GALA-VIP-233-25)
    const ticketCode = `${eventType.toUpperCase()}-${Math.floor(
      233 + Math.random() * 100
    )}-${new Date().getFullYear()}`;

    // Générer un QR code
    const qrPath = `./uploads/${ticketCode}.png`;
    await QRCode.toFile(qrPath, `Code Billet: ${ticketCode}`);

    // Sauvegarde dans MongoDB
    const newReg = new Registration({
      fullName,
      email,
      eventType,
      phone,
      fileUrl: req.file ? req.file.path : null,
      ticketCode,
    });
    await newReg.save();

    // Envoi d’un email de confirmation
    const mailOptions = {
      from: `"Charity & Hope Africa" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎟️ Confirmation d'inscription - ${eventType}`,
      html: `
        <h3>Bonjour ${fullName},</h3>
        <p>Merci pour votre inscription à <b>${eventType}</b>.</p>
        <p>Voici votre code de billet : <b>${ticketCode}</b></p>
        <p>Conservez-le précieusement pour vos accès aux événements.</p>
        <p>Fraternellement,<br>Charity & Hope Africa Empowerment</p>
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
      message: "Inscription réussie, email envoyé ✅",
      ticketCode,
    });
  } catch (error) {
    console.error("❌ Erreur lors de l’inscription:", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

// 🌐 Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Serveur Charity & Hope actif sur le port ${PORT}`)
);
