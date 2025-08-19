import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Crée le dossier 'uploads' s'il n'existe pas
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Configuration multer
export const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // max 10 Mo
  fileFilter: (req, file, cb) => {
    // exemple : accepter seulement PDF et images
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Type de fichier non autorisé'));
  }
});
