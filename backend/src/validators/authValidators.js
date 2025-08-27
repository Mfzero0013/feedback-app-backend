const Joi = require('joi');

const registerSchema = Joi.object({
  nome: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Nome é obrigatório',
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 100 caracteres'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'Email é obrigatório',
      'string.email': 'Email deve ter um formato válido'
    }),
  
  senha: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Senha é obrigatória',
      'string.min': 'Senha deve ter pelo menos 6 caracteres'
    }),
  
  cargo: Joi.string()
    .max(100)
    .optional(),
  
  departamento: Joi.string()
    .max(100)
    .optional(),
  
  perfil: Joi.string()
    .valid('ADMIN', 'GESTOR', 'USUARIO')
    .default('USUARIO'),
  
  telefone: Joi.string()
    .pattern(/^[\d\s\-\(\)\+]+$/)
    .optional()
    .messages({
      'string.pattern.base': 'Telefone deve conter apenas números e caracteres válidos'
    }),
  
  dataAdmissao: Joi.date()
    .optional()
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'Email é obrigatório',
      'string.email': 'Email deve ter um formato válido'
    }),
  
  senha: Joi.string()
    .required()
    .messages({
      'string.empty': 'Senha é obrigatória'
    })
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Por favor, forneça um email válido.',
      'any.required': 'O campo de email é obrigatório.'
    })
});

const resetPasswordSchema = Joi.object({
  senha: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'A nova senha deve ter no mínimo 6 caracteres.',
      'any.required': 'O campo de senha é obrigatório.'
    })
});

const changePasswordSchema = Joi.object({
  senhaAntiga: Joi.string()
    .required()
    .messages({
      'string.empty': 'Senha atual é obrigatória'
    }),
  
  novaSenha: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Nova senha é obrigatória',
      'string.min': 'Nova senha deve ter pelo menos 6 caracteres'
    })
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema
};
