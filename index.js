import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import hpp from "hpp";

// Swagger
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";

// Routes
import accesRoutes from "./routes/accesRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import dossierRoutes from "./routes/dossierRoutes.js";

dotenv.config();
const app = express();
app.set("trust proxy", 1);

// Swagger setup
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const swaggerPath = path.join(__dirname, "docs", "swagger.json");
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf-8"));
console.log("Routes Swagger chargées :", Object.keys(swaggerDocument.paths));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Sécurité globale
app.use(helmet());

// CORS
const allowedOrigins = [
  "https://health-safe-front.vercel.app",
  "http://localhost:3000",
  "https://healthsafe-v1-production.up.railway.app"
];

app.use(cors({
  origin: (origin, callback) => {
    // Permettre les requêtes sans origin (Postman, mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS bloqué pour:', origin);
      callback(new Error("CORS non autorisé"));
    }
  },
  credentials: true, // ESSENTIEL pour les cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization",
    "Cookie" // Permettre l'envoi de cookies
  ],
  exposedHeaders: ["Set-Cookie"] // Permettre de recevoir les cookies
}));

// Middleware généraux
app.use(hpp());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Limitation globale
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Limitation spécifique login/reset
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Trop de tentatives, réessayez dans 15 minutes.",
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dossiers", dossierRoutes);
app.use("/api/acces", accesRoutes);

// Health check
app.get("/", (req, res) => res.send("API HealthSafe OK"));

// 404
app.use((req, res) => res.status(404).json({ message: "Route introuvable." }));

// Erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Erreur serveur." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur port ${PORT}`));
