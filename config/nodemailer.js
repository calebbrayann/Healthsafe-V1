import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export async function envoyerEmail(type, destinataire, options = {}) {
  const { EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("EMAIL_USER ou EMAIL_PASS manquant dans le .env");
  }

  if (!destinataire) {
    throw new Error("Destinataire manquant pour l'envoi d'email");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  let subject = "";
  let text = "";
  let html = "";

  switch (type) {
    case "bienvenue": {
      const nom = options.nom || "";
      const codePatient = options.codePatient || "";
      subject = "Bienvenue sur HealthSafe !";
      text = `Bienvenue ${nom},\n\nMerci de t’être inscrit sur HealthSafe, l’application qui prend soin de ta santé.\nTon code patient est : ${codePatient}\nVérifie ton compte via ce lien : ${options.lien}\n\nOn est ravi de t’avoir avec nous. À bientôt !`;
      html = `
        <div style="font-family:sans-serif; line-height:1.6; color:#333;">
          <h2 style="color:#2c3e50;">Bienvenue ${nom}</h2>
          <p>Merci de t’être inscrit sur <strong>HealthSafe</strong>,</p>
          <p>l’application qui prend soin de ta santé et de ton bien-être.</p>
          <p><strong>Ton code patient : ${codePatient}</strong></p>
          <p>Pour vérifier ton compte, clique sur le lien ci-dessous :</p>
          <p><a href="${options.lien}" style="color:#1a73e8; text-decoration:none;">Vérifier mon compte</a></p>
          <p style="margin-top:20px;">On est ravi de t’avoir avec nous.</p>
          <p><strong>L’équipe HealthSafe</strong></p>
        </div>
      `;
      break;
    }

    case "bienvenueMedecin": {
      const { nom = "", specialite = "", numeroLicence = "", hopital = "" } = options;
      subject = "Bienvenue sur HealthSafe !";
      text = `Bonjour Dr ${nom},

Merci de vous être inscrit sur HealthSafe, la plateforme qui centralise et sécurise les dossiers médicaux de vos patients.

Votre compte est actuellement en attente de validation par l'administrateur.

Détails de votre inscription :
- Spécialité : ${specialite}
- Numéro de licence : ${numeroLicence}
- Hôpital : ${hopital}

Nous sommes ravis de vous compter parmi nous et vous informerons dès que votre compte sera validé.`;

      html = `
        <div style="font-family:sans-serif; line-height:1.6; color:#333;">
          <h2>Bienvenue Dr ${nom}</h2>
          <p>Merci de vous être inscrit sur <strong>HealthSafe</strong>, la plateforme qui centralise et sécurise les dossiers médicaux de vos patients.</p>
          <p>Votre compte est actuellement en attente de validation par l'administrateur.</p>
          <h3>Détails de votre inscription :</h3>
          <ul>
            <li><strong>Spécialité :</strong> ${specialite}</li>
            <li><strong>Numéro de licence :</strong> ${numeroLicence}</li>
            <li><strong>Hôpital :</strong> ${hopital}</li>
          </ul>
          <p>Nous sommes ravis de vous compter parmi nous et vous informerons dès que votre compte sera validé.</p>
          <p><strong>L’équipe HealthSafe</strong></p>
        </div>
      `;
      break;
    }

    case "compteValideMedecin": {
      const { nom = "", specialite = "", hopital = "" } = options;
      subject = "Votre compte HealthSafe est maintenant validé !";
      text = `Bonjour Dr ${nom},

Félicitations ! Votre compte HealthSafe a été validé par l'administrateur.

Vous pouvez maintenant accéder à la plateforme et commencer à gérer vos dossiers médicaux.

Détails de votre profil :
- Spécialité : ${specialite}
- Hôpital : ${hopital}

Nous vous souhaitons une excellente expérience sur HealthSafe.`;

      html = `
        <div style="font-family:sans-serif; line-height:1.6; color:#333;">
          <h2>Compte validé – Dr ${nom}</h2>
          <p>Félicitations ! Votre compte <strong>HealthSafe</strong> a été validé par l'administrateur.</p>
          <p>Vous pouvez maintenant accéder à la plateforme et commencer à gérer vos dossiers médicaux.</p>
          <h3>Détails de votre profil :</h3>
          <ul>
            <li><strong>Spécialité :</strong> ${specialite}</li>
            <li><strong>Hôpital :</strong> ${hopital}</li>
          </ul>
          <p>Nous vous souhaitons une excellente expérience sur <strong>HealthSafe</strong>.</p>
          <p><strong>L’équipe HealthSafe</strong></p>
        </div>
      `;
      break;
    }

    case "accesAccorde": {
      const { nomMedecin = "", nomPatient = "" } = options;
      subject = "Accès au dossier accordé";
      text = `Bonjour Dr ${nomMedecin},\n\nLe patient ${nomPatient} vous a accordé l'accès à son dossier.`;
      html = `
        <div style="font-family:sans-serif; line-height:1.6; color:#333;">
          <p>Bonjour Dr <strong>${nomMedecin}</strong>,</p>
          <p>Le patient <strong>${nomPatient}</strong> vous a accordé l'accès à son dossier médical.</p>
          <p>Vous pouvez désormais le consulter sur <strong>HealthSafe</strong>.</p>
        </div>
      `;
      break;
    }

    case "accesRevoque": {
      const { nomMedecin = "", nomPatient = "" } = options;
      subject = "Accès au dossier révoqué";
      text = `Bonjour Dr ${nomMedecin},\n\nLe patient ${nomPatient} a révoqué votre accès à son dossier.`;
      html = `
        <div style="font-family:sans-serif; line-height:1.6; color:#333;">
          <p>Bonjour Dr <strong>${nomMedecin}</strong>,</p>
          <p>Le patient <strong>${nomPatient}</strong> a révoqué votre accès à son dossier médical.</p>
          <p>Vous ne pouvez plus le consulter sur <strong>HealthSafe</strong>.</p>
        </div>
      `;
      break;
    }

    case "nouveauDossier": {
      const { nomMedecin = "", titreDossier = "" } = options;
      subject = "Nouveau dossier ajouté sur HealthSafe";
      text = `Le Dr ${nomMedecin} a créé un nouveau dossier : ${titreDossier}`;
      html = `
        <div style="font-family:sans-serif; line-height:1.6; color:#333;">
          <h2>Nouveau dossier ajouté</h2>
          <p>Le Dr <strong>${nomMedecin}</strong> a créé un nouveau dossier :</p>
          <p><strong>${titreDossier}</strong></p>
        </div>
      `;
      break;
    }

    case "reset": {
      const { nom = "", lien = "#" } = options;
      subject = "Réinitialisation de ton mot de passe";
      text = `Bonjour ${nom},\n\nVoici ton lien de réinitialisation :\n${lien}\n\nCe lien est valable 30 minutes.`;
      html = `
        <div style="font-family:sans-serif; line-height:1.6;">
          <p>Bonjour ${nom},</p>
          <p>Tu as demandé à réinitialiser ton mot de passe.</p>
          <p><a href="${lien}" style="color:#1a73e8; text-decoration:none;">Clique ici pour réinitialiser ton mot de passe</a></p>
          <p>Ce lien est valide pendant <strong>30 minutes</strong>.</p>
        </div>
      `;
      break;
    }

    case "notificationAdmin": {
      const { nom = "", email = "" } = options;
      subject = "Nouvelle inscription sur HealthSafe";
      text = `Un nouvel utilisateur vient de s'inscrire.\nNom : ${nom}\nEmail : ${email}`;
      html = `
        <div style="font-family:sans-serif; line-height:1.6; color:#333;">
          <h2>Nouvelle inscription</h2>
          <p>Nom : ${nom}</p>
          <p>Email : ${email}</p>
        </div>
      `;
      break;
    }

    default:
      throw new Error(
        "Type d'e-mail non reconnu (attendu : 'bienvenue', 'bienvenueMedecin', 'compteValideMedecin', 'accesAccorde', 'accesRevoque', 'nouveauDossier', 'reset', 'notificationAdmin')"
      );
  }

  try {
    const info = await transporter.sendMail({
      from: `"Support HealthSafe" <${EMAIL_USER}>`,
      to: destinataire,
      subject,
      text,
      html,
    });

    console.log(`[EMAIL] ${type} envoyé à ${destinataire} (ID: ${info.messageId})`);
  } catch (error) {
    console.error(`[EMAIL] Erreur ${type} :`, error.message);
    throw new Error("Erreur lors de l'envoi de l'e-mail");
  }
}
