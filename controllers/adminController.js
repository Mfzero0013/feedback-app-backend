const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');

// Funções CRUD para Usuários

// Listar todos os usuários
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                equipe: true, // Inclui todos os dados da equipe relacionada
            },
        });
        res.status(200).json({ status: 'success', data: users });
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        next(error);
    }
};

// Criar um novo usuário
exports.createUser = async (req, res, next) => {
    const { nome, email, senha, cargo, jobTitle, equipeId, status } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(senha, 10);
        const newUser = await prisma.user.create({
            data: {
                nome,
                email,
                senha: hashedPassword,
                cargo,
                jobTitle,
                equipeId,
                status,
            },
        });
        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error in createUser:', error);
        next(error);
    }
};


// Criar uma nova equipe
exports.createTeam = async (req, res, next) => {
    const { nome, descricao, gestorId } = req.body;
    try {
        const newTeam = await prisma.equipe.create({
            data: {
                nome,
                descricao,
                gestorId: gestorId || null,
            },
        });
        res.status(201).json({ status: 'success', data: newTeam });
    } catch (error) {
        // Trata erro de nome de equipe duplicado
        if (error.code === 'P2002' && error.meta?.target?.includes('nome')) {
            return next(new AppError('Já existe uma equipe com este nome.', 409));
        }
        console.error('Error in createTeam:', error);
        next(error);
    }
};

exports.updateUser = async (req, res, next) => {
    const { id } = req.params;
    const { nome, email, cargo, jobTitle, equipeId, status } = req.body;
    try {
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id, 10) },
            data: {
                nome,
                email,
                cargo,
                jobTitle,
                equipeId,
                status,
            },
        });
        res.json(updatedUser);
    } catch (error) {
        console.error('Error in updateUser:', error);
        next(error);
    }
};

// Deletar um usuário
exports.deleteUser = async (req, res, next) => {
    const { id } = req.params;
    try {
        await prisma.user.delete({ where: { id: parseInt(id, 10) } });
        res.status(204).send();
    } catch (error) {
        console.error('Error in deleteUser:', error);
        next(error);
    }
};

// Funções CRUD para Equipes

// Listar todas as equipes com seus gestores e membros
exports.getAllTeams = async (req, res, next) => {
    try {
        const teams = await prisma.equipe.findMany({
            include: {
                gestor: true, // Inclui dados do gestor
                membros: true, // Inclui a lista de membros
            },
        });
        res.json(teams);
    } catch (error) {
        console.error('Error in getAllTeams:', error);
        next(error);
    }
};


// Atualizar uma equipe
exports.updateTeam = async (req, res, next) => {
    const { id } = req.params;
    const { nome, descricao, gestorId } = req.body;
    try {
        const updatedTeam = await prisma.equipe.update({
            where: { id: parseInt(id, 10) },
            data: {
                nome,
                descricao,
                gestorId,
            },
        });
        res.json(updatedTeam);
    } catch (error) {
        console.error('Error in updateTeam:', error);
        next(error);
    }
};

// Deletar uma equipe
exports.deleteTeam = async (req, res, next) => {
    const { id } = req.params;
    try {
        // Desvincular usuários antes de deletar a equipe
        await prisma.user.updateMany({
            where: { equipeId: parseInt(id, 10) },
            data: { equipeId: null },
        });
        await prisma.equipe.delete({ where: { id: parseInt(id, 10) } });
        res.status(204).send();
    } catch (error) {
        console.error('Error in deleteTeam:', error);
        next(error);
    }
};
