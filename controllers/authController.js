// controllers/authController.js
import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { envoyerEmail } from "../config/nodemailer.js";
import { generateCodePatient } from "../utils/generateCodePatient.js";

//  INSCRIPTION PATIENT
export async function registerPatient(req, res) {
  console.log(req.body);
  try {
    const { nom, prenom, email, password, telephone, dateNaissance } = req.body;

    if (!nom || !prenom || !email || !password || !telephone || !dateNaissance)
      return res.status(400).json({ message: "Tous les champs sont requis." });

    const existingUser = await prisma.utilisateur.findUnique({
      where: { email },
    });
    if (existingUser)
      return res.status(400).json({ message: "Email déjà utilisé." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const codePatient = generateCodePatient();

    const newUser = await prisma.utilisateur.create({
      data: {
        nom,
        prenom,
        email,
        motDePasse: hashedPassword,
        telephone,
        dateNaissance: new Date(dateNaissance),
        role: "PATIENT",
        codePatient,
        verifie: false,
      },
    });

    const verificationToken = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Envoi de l'email de bienvenue incluant le codePatient
    await envoyerEmail("bienvenue", email, {
      nom,
      codePatient,
      lien: `${process.env.FRONT_URL}/verify/${verificationToken}`,
    });

    // Notification de l'admin pour le nouvel utilisateur
    try {
      await envoyerEmail("notificationAdmin", process.env.EMAIL_ADMIN, {
        nom,
        email,
      });
    } catch (err) {
      console.error("Erreur envoi email admin:", err.message);
    }

    // Réponse JSON incluant le codePatient pour Postman / front
    return res.status(201).json({
      message: "Inscription réussie. Vérifiez votre email.",
      codePatient,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
}

export async function registerMedecin(req, res) {
  try {
    const {
      nom,
      prenom,
      email,
      password,
      telephone,
      specialite,
      numero_licence,
      hopital,
    } = req.body;

    if (
      !nom ||
      !prenom ||
      !email ||
      !password ||
      !telephone ||
      !specialite ||
      !numero_licence ||
      !hopital
    ) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    const existingUser = await prisma.utilisateur.findUnique({
      where: { email },
    });
    if (existingUser)
      return res.status(400).json({ message: "Email déjà utilisé." });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Création du médecin avec tous les champs nécessaires
    const newUser = await prisma.utilisateur.create({
      data: {
        nom,
        prenom,
        email,
        motDePasse: hashedPassword,
        telephone,
        role: "MEDECIN",
        specialite,
        numeroLicence: numero_licence, // correspond à ton schema Prisma
        hopital,
        verifie: false,
      },
    });

    // Envoi email admin
    try {
      await envoyerEmail("notificationAdmin", process.env.EMAIL_ADMIN, {
        nom,
        email,
      });
    } catch (err) {
      console.error("Erreur envoi email admin:", err.message);
    }

    // Envoi email au médecin pour l'informer de son inscription
    try {
      await envoyerEmail("bienvenueMedecin", email, {
        nom,
        specialite,
        numeroLicence: numero_licence,
        hopital,
        message:
          "Votre inscription a été enregistrée. En attente de validation par l’admin.",
      });
    } catch (err) {
      console.error("Erreur envoi email médecin:", err.message);
    }

    return res
      .status(201)
      .json({
        message: "Inscription médecin réussie. En attente de validation admin.",
      });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
}


export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Tous les champs sont requis." });

    const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });
    if (!utilisateur) return res.status(401).json({ message: "Identifiants incorrects." });

    const isMatch = await bcrypt.compare(password, utilisateur.motDePasse);
    if (!isMatch) return res.status(401).json({ message: "Identifiants incorrects." });
    if (!utilisateur.verifie) return res.status(401).json({ message: "Compte non vérifié." });

    // Génération accessToken (court terme)
    const accessToken = jwt.sign(
      { userId: utilisateur.id, role: utilisateur.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Génération refreshToken (long terme)
    const refreshToken = jwt.sign(
      { userId: utilisateur.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // Stocker refreshToken dans la DB
    await prisma.refreshToken.create({
      data: {
        utilisateurId: utilisateur.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Envoi cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Réponse enrichie pour le frontend
    return res.json({
      message: "Connexion réussie.",
      user: {
        id: utilisateur.id,
        role: utilisateur.role,
        email: utilisateur.email,
        firstName: utilisateur.prenom,
        lastName: utilisateur.nom,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
}


//  VERIFICATION EMAIL
export async function verifyEmail(req, res) {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await prisma.utilisateur.update({
      where: { id: decoded.userId },
      data: { verifie: true },
    });

    return res.json({ message: "Email vérifié avec succès." });
  } catch {
    return res.status(400).json({ message: "Token invalide ou expiré." });
  }
}

//  DEMANDE RESET MOT DE PASSE
export async function requestResetPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requis." });

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { email },
    });
    if (!utilisateur)
      return res.status(404).json({ message: "Email non trouvé." });

    const resetToken = jwt.sign(
      { userId: utilisateur.id },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );

    await prisma.resetToken.create({
      data: {
        utilisateurId: utilisateur.id,
        token: resetToken,
        expiration: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    await envoyerEmail("reset", email, {
      nom: utilisateur.nom,
      lien: `${process.env.FRONT_URL}/reset-password/${resetToken}`,
    });

    return res.json({ message: "Email de réinitialisation envoyé." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
}

//  REINITIALISATION MOT DE PASSE
export async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password)
      return res.status(400).json({ message: "Mot de passe requis." });

    const resetTokenEntry = await prisma.resetToken.findUnique({
      where: { token },
    });
    if (!resetTokenEntry || resetTokenEntry.expiration < new Date())
      return res.status(400).json({ message: "Token invalide ou expiré." });

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.utilisateur.update({
      where: { id: resetTokenEntry.utilisateurId },
      data: { motDePasse: hashedPassword },
    });

    await prisma.resetToken.delete({ where: { token } });

    return res.json({ message: "Mot de passe réinitialisé." });
  } catch {
    return res.status(500).json({ message: "Erreur serveur." });
  }
}
// LOGOUT sécurisé
export async function logout(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    // Supprimer le refreshToken côté serveur
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }

    // Supprimer les cookies côté client
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.json({ message: "Déconnexion réussie." });
  } catch (err) {
    console.error("Erreur logout:", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
}


//  RESET CODE PATIENT — corrigé
export async function resetCodePatient(req, res) {
  try {
    const userId = req.user.id;

    const newCode = generateCodePatient();

    await prisma.utilisateur.update({
      where: { id: userId },
      data: { codePatient: newCode },
    });

    return res.json({
      message: "Nouveau code patient généré.",
      codePatient: newCode,
    });
  } catch (err) {
    console.error("Erreur dans resetCodePatient :", err); // ← utile pour debug
    return res.status(500).json({ message: "Erreur serveur." });
  }
}



// Dans authController.js - Version simplifiée de la route /me
export async function me(req, res) {
  try {
    // L'utilisateur est déjà récupéré et vérifié par authMiddleware
    const user = req.user;
    
    return res.status(200).json({
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        firstName: user.prenom,
        lastName: user.nom,
        codePatient: user.codePatient, // Utile pour les patients
        specialite: user.specialite,   // Utile pour les médecins
        hopital: user.hopital          // Utile pour les médecins/admins
      },
    });
  } catch (err) {
    console.error("Erreur dans /me:", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
}


export async function refresh(req, res) {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: "Non authentifié." });

  try {
    // Vérifier token et existence dans DB
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    const tokenEntry = await prisma.refreshToken.findUnique({ where: { token } });
    if (!tokenEntry || tokenEntry.expiresAt < new Date()) {
      return res.status(401).json({ message: "Refresh token invalide ou expiré." });
    }

    // Générer nouveau accessToken
    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 15*60*1000
    });

    return res.json({ message: "Access token régénéré." });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Refresh token invalide ou expiré." });
  }
}
