<<<<<<< HEAD
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
=======
const prisma = require('../lib/prisma');
>>>>>>> ba508e88f0c67f5523382fe5ed8f61e1c86f97c6
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const AppError = require('../utils/AppError');

// Schema de validação para o registro
const registerSchema = Joi.object({
    nome: Joi.string().required().messages({
        'string.empty': 'O campo nome é obrigatório.',
        'any.required': 'O campo nome é obrigatório.'
    }),
    email: Joi.string().email().required().messages({
        'string.empty': 'O campo e-mail é obrigatório.',
        'string.email': 'Por favor, insira um e-mail válido.',
        'any.required': 'O campo e-mail é obrigatório.'
    }),
    senha: Joi.string().min(6).required().messages({
        'string.empty': 'O campo senha é obrigatório.',
        'string.min': 'A senha deve ter no mínimo {#limit} caracteres.',
        'any.required': 'O campo senha é obrigatório.'
    }),
    jobTitle: Joi.string().allow(null, ''),
    departamento: Joi.string().required().messages({
        'string.empty': 'O campo departamento é obrigatório.',
        'any.required': 'O campo departamento é obrigatório.'
    }),
    accountType: Joi.string().valid('user', 'admin').required().messages({
        'string.empty': 'O campo tipo de conta é obrigatório.',
        'any.required': 'O campo tipo de conta é obrigatório.',
        'any.only': 'O tipo de conta selecionado é inválido.'
    }),
});

// Função para registrar um novo usuário
const registerUser = async (req, res, next) => {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 400, 'VALIDATION_ERROR'));
    }

    const { nome, email, senha, jobTitle, departamento, accountType } = value;

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return next(new AppError('Este e-mail já está em uso.', 409, 'EMAIL_IN_USE'));
        }

        // Procura ou cria o departamento
        const department = await prisma.equipe.upsert({
            where: { nome: departamento },
            update: {},
            create: { nome: departamento },
        });

        const hashedPassword = await bcrypt.hash(senha, 10);

        const cargoMap = {
            user: 'COLABORADOR',
            admin: 'ADMINISTRADOR',
        };

        const newUser = await prisma.user.create({
            data: {
                nome,
                email,
                senha: hashedPassword,
                cargo: cargoMap[accountType],
                jobTitle: jobTitle,
                status: 'ATIVO',
                equipeId: department.id,
            },
        });

        const { senha: _, ...userWithoutPassword } = newUser;

        res.status(201).json({ message: 'Usuário cadastrado com sucesso!', user: userWithoutPassword });

    } catch (err) {
<<<<<<< HEAD
=======
        console.error('Error during user registration:', err);
>>>>>>> ba508e88f0c67f5523382fe5ed8f61e1c86f97c6
        return next(new AppError('Não foi possível concluir o cadastro. Por favor, tente novamente mais tarde.', 500, 'INTERNAL_ERROR'));
    }
};

// Schema de validação para o login
const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.empty': 'O campo e-mail é obrigatório.',
        'string.email': 'Por favor, insira um e-mail válido.',
        'any.required': 'O campo e-mail é obrigatório.'
    }),
    senha: Joi.string().required().messages({
        'string.empty': 'O campo senha é obrigatório.',
        'any.required': 'O campo senha é obrigatório.'
    }),
});

// Função para autenticar um usuário
const loginUser = async (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400, 'VALIDATION_ERROR'));
  }

  const { email, senha } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return next(new AppError('Credenciais inválidas.', 401, 'INVALID_CREDENTIALS'));
    }

    if (!(await bcrypt.compare(senha, user.senha))) {
      return next(new AppError('Credenciais inválidas.', 401, 'INVALID_CREDENTIALS'));
    }

    if (user.status !== 'ATIVO') {
      return next(new AppError('Este usuário não está ativo. Entre em contato com o administrador.', 403, 'USER_INACTIVE'));
    }

    const token = jwt.sign(
      { userId: user.id, cargo: user.cargo },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        cargo: user.cargo,
      },
    });
  } catch (err) {
<<<<<<< HEAD
=======
    console.error('Error during user login:', err);
>>>>>>> ba508e88f0c67f5523382fe5ed8f61e1c86f97c6
    return next(new AppError('Não foi possível fazer o login. Por favor, tente novamente mais tarde.', 500, 'INTERNAL_ERROR'));
  }
};

module.exports = {
  registerUser,
  loginUser,
};
