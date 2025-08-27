const Joi = require('joi');

const upsertSettingSchema = Joi.object({
  chave: Joi.string().alphanum().min(3).max(50).required()
    .messages({
      'string.alphanum': 'A chave deve conter apenas letras e números.',
      'string.min': 'A chave deve ter no mínimo 3 caracteres.',
      'string.max': 'A chave deve ter no máximo 50 caracteres.',
      'any.required': 'A chave é obrigatória.'
    }),
  valor: Joi.string().required()
    .messages({
      'any.required': 'O valor é obrigatório.'
    }),
  descricao: Joi.string().optional().allow('')
});

module.exports = {
  upsertSettingSchema
};
