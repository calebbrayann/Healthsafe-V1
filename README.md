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


5. Documentation Swagger

La documentation complète de l’API est disponible dans docs/swagger.json.
Pour visualiser Swagger UI :

Installer Swagger UI Express (si nécessaire) :

pnpm add swagger-ui-express


Modifier index.js :

import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './docs/swagger.json' assert { type: 'json' };

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


Accéder à la documentation :

http://localhost:3000/api-docs 

healthsafe-v1-production.up.railway.app/api-docs
