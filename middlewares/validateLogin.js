import Joi from 'joi';

export const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.empty': `"email" est requis`,
      'string.email': `"email" doit être un email valide`
    }),
    password: Joi.string().min(6).required().messages({
      'string.empty': `"password" est requis`,
      'string.min': `"password" doit contenir au moins 6 caractères`
    })
  });

  const { error, value } = schema.validate(req.body, { abortEarly: true });

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  req.body = value;
  next();
};
