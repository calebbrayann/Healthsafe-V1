import Joi from 'joi';
import sanitizeHtml from 'sanitize-html';

  export const validateAndSanitize = (req, res, next) => {
  const schema = Joi.object({
    nom: Joi.string().required(),
    prenom: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    dateNaissance: Joi.date().required(),
    telephone: Joi.string().pattern(/^\d{9,}$/).required()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  // sanitize seulement les champs qui peuvent contenir du HTML
  value.nom = sanitizeHtml(value.nom);
  value.prenom = sanitizeHtml(value.prenom);

  req.body = value;
  next();
};
