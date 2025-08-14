const Joi = require('joi');

const updateUserSchema = Joi.object({
  nome: Joi.string()
    .min(2)
    .max(100)
    .optional(),
  
  email: Joi.string()
    .email()
    .optional(),
  
  cargo: Joi.string()
    .max(100)
    .optional(),
  
  departamento: Joi.string()
    .max(100)
    .optional(),
  
  perfil: Joi.string()
    .valid('ADMIN', 'GESTOR', 'USUARIO')
    .optional(),
  
  status: Joi.string()
    .valid('ATIVO', 'INATIVO')
    .optional(),
  
  telefone: Joi.string()
    .pattern(/^[\d\s\-\(\)\+]+$/)
    .optional()
    .messages({
      'string.pattern.base': 'Telefone deve conter apenas números e caracteres válidos'
    }),
  
  dataAdmissao: Joi.date()
    .optional()
}).min(1); // Pelo menos um campo deve ser fornecido para atualização

module.exports = {
  updateUserSchema
};
