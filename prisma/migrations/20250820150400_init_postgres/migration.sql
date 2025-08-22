-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('PATIENT', 'MEDECIN', 'ADMIN_HOPITAL', 'SUPER_ADMIN', 'REVOQUE');

-- CreateEnum
CREATE TYPE "public"."StatutDemande" AS ENUM ('EN_ATTENTE', 'ACCEPTEE', 'REFUSEE');

-- CreateTable
CREATE TABLE "public"."Utilisateur" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT,
    "dateNaissance" TIMESTAMP(3),
    "role" "public"."Role" NOT NULL DEFAULT 'PATIENT',
    "codePatient" TEXT,
    "verifie" BOOLEAN NOT NULL DEFAULT false,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "specialite" TEXT,
    "numeroLicence" TEXT,
    "hopital" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Dossier" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "numeroDossier" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medecinId" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMiseAJour" TIMESTAMP(3) NOT NULL,
    "adminId" TEXT,

    CONSTRAINT "Dossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DossierAutorisation" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "medecinId" TEXT NOT NULL,
    "autorisePar" TEXT NOT NULL,
    "dateAcces" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DossierAutorisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DemandeAcces" (
    "id" TEXT NOT NULL,
    "medecinId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "statut" "public"."StatutDemande" NOT NULL DEFAULT 'EN_ATTENTE',
    "dateDemande" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandeAcces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HistoriqueAcces" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "dateAcces" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoriqueAcces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ResetToken" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Consultation" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "medecinId" TEXT,
    "sujet" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SuppressionLog" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "suppriméPar" TEXT NOT NULL,
    "raison" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuppressionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "cibleId" TEXT,
    "meta" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "public"."Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_codePatient_key" ON "public"."Utilisateur"("codePatient");

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_numeroLicence_key" ON "public"."Utilisateur"("numeroLicence");

-- CreateIndex
CREATE UNIQUE INDEX "Dossier_numeroDossier_key" ON "public"."Dossier"("numeroDossier");

-- CreateIndex
CREATE UNIQUE INDEX "DossierAutorisation_dossierId_medecinId_key" ON "public"."DossierAutorisation"("dossierId", "medecinId");

-- CreateIndex
CREATE UNIQUE INDEX "ResetToken_token_key" ON "public"."ResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- AddForeignKey
ALTER TABLE "public"."Dossier" ADD CONSTRAINT "Dossier_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dossier" ADD CONSTRAINT "Dossier_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "public"."Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dossier" ADD CONSTRAINT "Dossier_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DossierAutorisation" ADD CONSTRAINT "DossierAutorisation_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "public"."Dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DossierAutorisation" ADD CONSTRAINT "DossierAutorisation_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "public"."Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DossierAutorisation" ADD CONSTRAINT "DossierAutorisation_autorisePar_fkey" FOREIGN KEY ("autorisePar") REFERENCES "public"."Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DemandeAcces" ADD CONSTRAINT "DemandeAcces_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "public"."Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DemandeAcces" ADD CONSTRAINT "DemandeAcces_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HistoriqueAcces" ADD CONSTRAINT "HistoriqueAcces_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "public"."Dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HistoriqueAcces" ADD CONSTRAINT "HistoriqueAcces_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "public"."Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResetToken" ADD CONSTRAINT "ResetToken_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "public"."Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VerificationToken" ADD CONSTRAINT "VerificationToken_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "public"."Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Consultation" ADD CONSTRAINT "Consultation_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SuppressionLog" ADD CONSTRAINT "SuppressionLog_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "public"."Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "public"."Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
