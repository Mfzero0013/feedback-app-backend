const Joi = require('joi');

const createFeedbackSchema = Joi.object({
  titulo: Joi.string().required()
    .messages({
      'string.empty': 'O título é obrigatório.',
      'any.required': 'O título é obrigatório.'
    }),
  descricao: Joi.string().min(10).required()
    .messages({
      'string.min': 'A descrição deve ter no mínimo 10 caracteres.',
      'any.required': 'A descrição é obrigatória.'
    }),
  classificacao: Joi.string().valid('OTIMO', 'MEDIA', 'RUIM').required()
    .messages({
      'any.only': 'A classificação deve ser OTIMO, MEDIA ou RUIM.',
      'any.required': 'A classificação é obrigatória.'
    }),
  observacao: Joi.string().allow('').optional(),
  isAnonymous: Joi.boolean().default(false),
  avaliadoId: Joi.string().uuid().required()
    .messages({
      'string.guid': 'O ID do avaliado deve ser um UUID válido.',
      'any.required': 'O ID do avaliado é obrigatório.'
    }),
  equipeId: Joi.string().uuid().optional()
    .messages({
      'string.guid': 'O ID da equipe deve ser um UUID válido.'
    })
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
