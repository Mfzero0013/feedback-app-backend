require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Configuração do Pool de Conexões com PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necessário para algumas conexões, como Heroku ou Supabase
  }
});

// Função para executar a criação de tabelas
async function createTables() {
  const client = await pool.connect();
  try {
    const tableCreationQueries = [
      // Tabela de usuários (sintaxe ajustada para PostgreSQL)
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK(role IN ('Administrador', 'Gestor', 'Usuário')),
        department VARCHAR(100) NOT NULL,
        position VARCHAR(100) NOT NULL,
        avatar_url TEXT,
        status VARCHAR(50) DEFAULT 'Ativo' CHECK(status IN ('Ativo', 'Inativo', 'Suspenso')),
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de equipes
      `CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de membros da equipe
      `CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'Membro',
        joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, user_id)
      )`,

      // Tabela de feedbacks
      `CREATE TABLE IF NOT EXISTS feedbacks (
        id SERIAL PRIMARY KEY,
        from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL CHECK(type IN ('Desempenho', 'Comportamento', 'Projeto específico', '360°')),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        rating INTEGER CHECK(rating >= 1 AND rating <= 10),
        status VARCHAR(50) DEFAULT 'Pendente' CHECK(status IN ('Pendente', 'Em análise', 'Aprovado', 'Rejeitado')),
        priority VARCHAR(50) DEFAULT 'Média' CHECK(priority IN ('Baixa', 'Média', 'Alta', 'Crítica')),
        due_date DATE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de comentários nos feedbacks
      `CREATE TABLE IF NOT EXISTS feedback_comments (
        id SERIAL PRIMARY KEY,
        feedback_id INTEGER NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de competências
      `CREATE TABLE IF NOT EXISTS competencies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        weight INTEGER DEFAULT 1 CHECK(weight >= 1 AND weight <= 5)
      )`,

      // Tabela de avaliações de competências
      `CREATE TABLE IF NOT EXISTS competency_ratings (
        id SERIAL PRIMARY KEY,
        feedback_id INTEGER NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
        competency_id INTEGER NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 10),
        notes TEXT
      )`,

      // Tabela de notificações
      `CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info' CHECK(type IN ('info', 'success', 'warning', 'error')),
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de configurações do sistema
      `CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de logs de auditoria
      `CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          action VARCHAR(255) NOT NULL,
          table_name VARCHAR(100),
          record_id INTEGER,
          old_values JSONB,
          new_values JSONB,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    // Executa cada query de criação de tabela em sequência
    for (const query of tableCreationQueries) {
      await client.query(query);
    }
    console.log('✅ Tabelas verificadas/criadas com sucesso no PostgreSQL.');

  } finally {
    client.release();
  }
}

// Função para popular dados iniciais (ex: admin)
async function seedInitialData() {
  const client = await pool.connect();
  try {
    // Verifica se já existe um administrador
    const res = await client.query("SELECT COUNT(*) FROM users WHERE role = 'Administrador'");
    if (res.rows[0].count > 0) {
      console.log('ℹ️ Dados iniciais já existem, pulando...');
      return;
    }

    // Cria o primeiro usuário como administrador
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await client.query(
      `INSERT INTO users (name, email, password, role, department, position, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['Administrador', 'admin@feedbackhub.com', hashedPassword, 'Administrador', 'TI', 'Administrador do Sistema', 'Ativo']
    );
    console.log('✅ Usuário administrador inicial criado com sucesso.');

  } finally {
    client.release();
  }
}

// Função de inicialização principal
async function initDatabase() {
  try {
    await createTables();
    await seedInitialData();
  } catch (err) {
    console.error('❌ Erro ao inicializar o banco de dados PostgreSQL:', err);
    throw err; // Lança o erro para que o processo principal possa capturá-lo
  }
}

// Funções auxiliares para executar queries
async function runQuery(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}

async function runSelect(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

async function runSelectOne(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows[0];
  } finally {
    client.release();
  }
}

module.exports = {
  initDatabase,
  runQuery,
  runSelect,
  runSelectOne,
  pool
};
