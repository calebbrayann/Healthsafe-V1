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

//  LOGIN
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Tous les champs sont requis." });

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { email },
    });
    if (!utilisateur)
      return res.status(401).json({ message: "Identifiants incorrects." });

    const isMatch = await bcrypt.compare(password, utilisateur.motDePasse);
    if (!isMatch)
      return res.status(401).json({ message: "Identifiants incorrects." });
    if (!utilisateur.verifie)
      return res.status(401).json({ message: "Compte non vérifié." });

    const token = jwt.sign(
      { userId: utilisateur.id, role: utilisateur.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({ message: "Connexion réussie.", token });
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

//  LOGOUT
export function logout(req, res) {
  res.clearCookie("token");
  return res.json({ message: "Déconnexion réussie." });
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

export function me(req, res) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: "Non authentifié." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // renvoyer les infos utiles (et pas tout le payload brut)
    return res.status(200).json({
      user: {
        id: decoded.userId,
        role: decoded.role,
        email: decoded.email, // si tu l'as mis dans le JWT
      },
    });
  } catch (err) {
    return res.status(401).json({ message: "Token invalide ou expiré." });
  }
}
