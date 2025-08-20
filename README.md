# HealthSafe - API Backend

HealthSafe est une plateforme médicale permettant de centraliser et sécuriser l’historique médical des patients.  
Le backend est construit avec **Node.js**, **Express**, **Prisma** et **SQLite/PostgreSQL**.  

## Fonctionnalités principales

- Authentification et gestion des rôles (SUPER_ADMIN, ADMIN_HOPITAL, MEDECIN, PATIENT)
- Gestion des dossiers médicaux (CRUD)
- Gestion des accès entre médecins et patients
- Validation et révocation des utilisateurs
- Audit des actions via logs
- Sécurité (JWT, rate limiting, Helmet, CORS, HPP)

---

##  Installation

1. Cloner le dépôt :

```bash
git clone https://github.com/<ton-utilisateur>/HealthSafe.git
cd HealthSafe


2. Installer les dépendances :

pnpm install


3. Créer un fichier .env avec les variables suivantes :

DATABASE_URL="file:./dev.db"
JWT_SECRET=...
SESSION_SECRET=...
FRONTEND_URL=...
EMAIL_USER=...
EMAIL_PASS=...

4. Lancer le serveur :

pnpm start

