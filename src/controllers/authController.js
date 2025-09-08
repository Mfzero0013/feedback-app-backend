const sendEmail = require('../utils/email');
const { getPrismaClient } = require('../database/connection');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const crypto = require('crypto');
const sendEmail = require('../utils/email');

// @desc    Registrar um novo usuário
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { nome, email, senha, cargo, departamento, perfil, telefone, dataAdmissao } = req.body;
    const prisma = getPrismaClient();

    const hashedPassword = await hashPassword(senha);

    const newUser = await prisma.user.create({
      data: {
        nome,
        email,
        senha: hashedPassword,
        cargo,
        departamento,
        perfil,
        telefone,
        dataAdmissao: dataAdmissao ? new Date(dataAdmissao) : null
      }
    });

    // Enviar e-mail de boas-vindas
    const subject = 'Bem-vindo ao FeedbackHub!';
    const html = `<h1>Olá, ${nome}!</h1><p>Seu cadastro foi realizado com sucesso em nossa plataforma.</p><p>Atenciosamente,<br>Equipe FeedbackHub</p>`;
    await sendEmail(email, subject, html);


    const token = generateToken({ id: newUser.id, perfil: newUser.perfil });

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso!',
      token,
      user: {
        id: newUser.id,
        nome: newUser.nome,
        email: newUser.email,
        perfil: newUser.perfil
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Autenticar usuário e obter token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    const prisma = getPrismaClient();

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await comparePassword(senha, user.senha))) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    if (user.status === 'INATIVO') {
      return res.status(401).json({ success: false, message: 'Usuário inativo' });
    }

    const token = generateToken({ id: user.id, perfil: user.perfil });

    res.json({
      success: true,
      message: 'Login bem-sucedido!',
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obter perfil do usuário logado
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Solicitar redefinição de senha
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const prisma = getPrismaClient();

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Resposta genérica para não revelar se o email existe ou não
      return res.json({ success: true, message: 'Se o e-mail estiver em nossa base de dados, um link para redefinição de senha será enviado.' });
    }

    // 1. Gerar o token de redefinição
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2. Hash do token e salvar no banco de dados
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000), // Expira em 10 minutos
      },
    });

    // 3. Enviar o email com o link de redefinição
    // ATENÇÃO: A URL deve apontar para a página do seu frontend que fará a redefinição
    const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

    const message = `
      <p>Você solicitou uma redefinição de senha. Por favor, clique no link abaixo para criar uma nova senha:</p>
      <a href="${resetURL}">${resetURL}</a>
      <p>Se você não solicitou isso, por favor, ignore este e-mail.</p>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Redefinição de Senha - FeedbackHub',
      html: message,
      text: `Copie e cole a seguinte URL no seu navegador: ${resetURL}`
    });

    res.json({ success: true, message: 'E-mail de redefinição enviado.' });

  } catch (error) {
    // Limpar campos de token em caso de erro no envio do email
    // (Opcional, mas boa prática)
    // await prisma.user.update({ where: { email: req.body.email }, data: { resetPasswordToken: null, resetPasswordExpires: null }});
    next(error);
  }
};

// @desc    Redefinir a senha
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { senha } = req.body;
    const prisma = getPrismaClient();

    // 1. Hash do token recebido para comparar com o do banco
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // 2. Encontrar usuário pelo token e verificar se não expirou
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Token inválido ou expirado.' });
    }

    // 3. Hash da nova senha e atualização do usuário
    const newHashedPassword = await hashPassword(senha);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        senha: newHashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    // Opcional: Logar o usuário automaticamente após redefinir a senha
    const jwtToken = generateToken({ id: user.id });

    res.json({ success: true, message: 'Senha redefinida com sucesso.', token: jwtToken });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword
};
