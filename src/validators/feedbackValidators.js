const Joi = require('joi');

const createFeedbackSchema = Joi.object({
  avaliado_id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'O ID do avaliado deve ser um UUID válido.',
      'any.required': 'O ID do avaliado é obrigatório.'
    }),
  tipo: Joi.string().valid('POSITIVO', 'CONSTRUTIVO', 'NEUTRO').required(),
  categoria: Joi.string().valid('DESEMPENHO', 'COMPORTAMENTO', 'PROJETO', 'EQUIPE', 'OUTRO').required(),
  conteudo: Joi.string().min(10).required()
    .messages({
      'string.min': 'O conteúdo deve ter no mínimo 10 caracteres.',
      'any.required': 'O conteúdo é obrigatório.'
    }),
  pontos_fortes: Joi.string().allow('').optional(),
  pontos_melhoria: Joi.string().allow('').optional(),
  nota: Joi.number().integer().min(1).max(5).optional()
});

const updateFeedbackStatusSchema = Joi.object({
  status: Joi.string().valid('PENDENTE', 'LIDO', 'ARQUIVADO').required()
    .messages({
      'any.required': 'O status é obrigatório.',
      'any.only': 'O status fornecido é inválido.'
    })
});

module.exports = {
  createFeedbackSchema,
  updateFeedbackStatusSchema
};
