const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');

// Funções CRUD para Usuários

// Listar todos os usuários
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                nome: true,
                email: true,
                cargo: true,
            },
        });
        res.status(200).json({ status: 'success', data: users });
    } catch (error) {
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
        next(error);
    }
};

exports.updateUser = async (req, res, next) => {
    const { id } = req.params;
    const { nome, email, cargo, jobTitle, equipeId, status } = req.body;
    try {
        const updatedUser = await prisma.user.update({
            where: { id },
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
        next(error);
    }
};

// Deletar um usuário
exports.deleteUser = async (req, res, next) => {
    const { id } = req.params;
    try {
        await prisma.user.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
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
        next(error);
    }
};


// Atualizar uma equipe
exports.updateTeam = async (req, res, next) => {
    const { id } = req.params;
    const { nome, descricao, gestorId } = req.body;
    try {
        const updatedTeam = await prisma.equipe.update({
            where: { id },
            data: {
                nome,
                descricao,
                gestorId,
            },
        });
        res.json(updatedTeam);
    } catch (error) {
        next(error);
    }
};

// Deletar uma equipe
exports.deleteTeam = async (req, res, next) => {
    const { id } = req.params;
    try {
        // Desvincular usuários antes de deletar a equipe
        await prisma.user.updateMany({
            where: { equipeId: id },
            data: { equipeId: null },
        });
        await prisma.equipe.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
