// scripts/createSuperAdmin.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  // Récupère les infos (ou valeurs par défaut raisonnables pour dev)
  const email = process.env.SUPERADMIN_EMAIL || 'healthsafes107@gmail.com';
  const password = process.env.SUPERADMIN_PASSWORD || 'Superadministrateur12345!';
  const nom = process.env.SUPERADMIN_NOM || 'ADMIN';
  const prenom = process.env.SUPERADMIN_PRENOM || 'Super';
  const telephone = process.env.SUPERADMIN_TEL || '074933114';
  const hopital = process.env.SUPERADMIN_HOPITAL || null;

  // Hash du mot de passe
  const motDePasse = await bcrypt.hash(password, 10);

  // Upsert par email (unique)
  const user = await prisma.utilisateur.upsert({
    where: { email },
    update: {
      motDePasse,
      nom,
      prenom,
      telephone,
      hopital,
      role: 'SUPER_ADMIN',
      verifie: true,
      actif: true,
    },
    create: {
      email,
      motDePasse,
      nom,
      prenom,
      telephone,
      dateNaissance: null,      // optionnel
      role: 'SUPER_ADMIN',
      codePatient: null,        // pas nécessaire pour un admin
      verifie: true,
      actif: true,
      specialite: null,
      numeroLicence: null,
      hopital,
    },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      role: true,
      verifie: true,
      actif: true,
    }
  });

  console.log('✅ SUPER_ADMIN prêt :');
  console.table(user);
  console.log('⚠️  Mot de passe défini pour ce compte :', password);
  console.log('   (pense à le changer en prod via un flux sécurisé)');
}

main()
  .catch((e) => {
    console.error('❌ Erreur création SUPER_ADMIN:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
