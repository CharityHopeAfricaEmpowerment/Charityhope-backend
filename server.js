// Charity & Hope Africa Empowerment - Backend
// Serveur principal (Express.js)

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// 🔗 Connexion à MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connecté à MongoDB Atlas"))
  .catch((err) => console.error("❌ Erreur de connexion MongoDB:", err));

// 🚦 Route test
app.get("/", (req, res) => {
  res.send("Bienvenue sur la plateforme Charity & Hope Africa Empowerment 🌍");
});

// 🌐 Port d’écoute
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
