const Joi = require('joi');

const generateReportSchema = Joi.object({
  title: Joi.string().min(3).max(100).required()
    .messages({
      'string.base': 'O título deve ser um texto.',
      'string.empty': 'O título é obrigatório.',
      'string.min': 'O título deve ter no mínimo 3 caracteres.',
      'string.max': 'O título deve ter no máximo 100 caracteres.',
      'any.required': 'O título é obrigatório.'
    }),
  type: Joi.string().valid('FEEDBACK_SUMMARY', 'USER_ENGAGEMENT').required()
    .messages({
      'any.only': 'O tipo de relatório deve ser um dos valores permitidos: FEEDBACK_SUMMARY, USER_ENGAGEMENT.',
      'any.required': 'O tipo de relatório é obrigatório.'
    }),
  filters: Joi.object({
    departamento: Joi.string(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate'))
  }).optional()
});

module.exports = {
  generateReportSchema,
};
