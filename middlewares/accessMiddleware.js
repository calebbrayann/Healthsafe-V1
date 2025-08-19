import prisma from "../config/prisma.js";

// Vérifie si c’est un médecin connecté
export function medecinOnly(req, res, next) {
  if (req.user.role !== "MEDECIN") {
    return res.status(403).json({ message: "Accès réservé aux médecins." });
  }
  next();
}

// Vérifie si c’est un patient connecté
export function patientOnly(req, res, next) {
  if (req.user.role !== "PATIENT") {
    return res.status(403).json({ message: "Accès réservé aux patients." });
  }
  next();
}

// Vérifie si l’accès a été accordé (avant consultation d’un dossier par ex.)
export async function checkAccess(req, res, next) {
  try {
    const { patientId } = req.params;
    const medecinId = req.user.id;

    // Vérifier si l’accès est accordé
    const access = await prisma.acces.findFirst({
      where: {
        patientId,
        medecinId,
        statut: "ACCEPTE"
      }
    });

    if (!access) {
      return res.status(403).json({ message: "Accès non autorisé au dossier du patient." });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur middleware checkAccess", error: error.message });
  }
}
