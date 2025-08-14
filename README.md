# 🚀 FeedbackHub - Sistema de Gestão de Feedback

## 📋 Visão Geral

O **FeedbackHub** é um sistema completo de gestão de feedback corporativo, desenvolvido com Node.js, Express e SQLite. O sistema oferece funcionalidades avançadas para gestão de usuários, equipes, feedbacks e relatórios, com controle de permissões baseado em papéis.

## ✨ Funcionalidades Principais

### 🔐 **Sistema de Autenticação e Autorização**
- **Login/Logout** com JWT
- **Registro de usuários** (primeiro usuário ou por administradores)
- **Recuperação de senha**
- **Controle de permissões** baseado em papéis (Administrador, Gestor, Usuário)
- **Middleware de autenticação** para proteção de rotas

### 👥 **Gestão de Usuários**
- **CRUD completo** de usuários
- **Perfis de usuário** com diferentes níveis de acesso
- **Gestão de departamentos** e cargos
- **Status de usuários** (Ativo, Inativo, Suspenso)
- **Reset de senhas** por administradores
- **Perfil pessoal** com estatísticas

### 🎯 **Sistema de Feedback**
- **Criação de feedbacks** com diferentes tipos:
  - Desempenho
  - Comportamento
  - Projeto específico
  - 360°
- **Sistema de avaliação** (1-10)
- **Prioridades** (Baixa, Média, Alta, Crítica)
- **Status de feedbacks** (Pendente, Em análise, Aprovado, Rejeitado)
- **Comentários** em feedbacks
- **Avaliação de competências** específicas
- **Filtros avançados** e busca

### 👥 **Gestão de Equipes**
- **Criação e gestão** de equipes
- **Membros de equipe** com funções (Membro, Líder, Especialista)
- **Gestores de equipe** com permissões especiais
- **Estatísticas de equipe** e produtividade
- **Gestão de membros** (adicionar, remover, alterar função)

### 📊 **Relatórios e Analytics**
- **Dashboard** com estatísticas gerais
- **Relatórios de feedback** com filtros avançados
- **Relatórios de usuários** com análise de atividade
- **Relatórios de equipes** com métricas de produtividade
- **Análise de performance** por período
- **Exportação de dados** (CSV)
- **Métricas de competências**

### 🔒 **Segurança e Auditoria**
- **Logs de auditoria** para todas as ações
- **Validação de dados** com Joi
- **Rate limiting** para proteção contra ataques
- **Headers de segurança** com Helmet
- **CORS configurável**
- **Compressão de respostas**

## 🏗️ Arquitetura do Sistema

### **Estrutura de Pastas**
```
backend/
├── config/          # Configurações do banco de dados
├── controllers/     # Controladores da aplicação
├── middleware/      # Middlewares (auth, validação)
├── models/          # Modelos de dados
├── routes/          # Rotas da API
├── scripts/         # Scripts de migração e seed
├── utils/           # Utilitários e helpers
├── server.js        # Servidor principal
└── package.json     # Dependências
```

### **Banco de Dados**
- **SQLite** para desenvolvimento e testes
- **Tabelas principais**:
  - `users` - Usuários do sistema
  - `teams` - Equipes
  - `team_members` - Membros das equipes
  - `feedbacks` - Feedbacks do sistema
  - `feedback_comments` - Comentários nos feedbacks
  - `competencies` - Competências avaliadas
  - `competency_ratings` - Avaliações de competências
  - `notifications` - Notificações do sistema
  - `system_settings` - Configurações do sistema
  - `audit_logs` - Logs de auditoria

## 🚀 Instalação e Configuração

### **Pré-requisitos**
- Node.js 16+ 
- npm ou yarn

### **1. Clonar o repositório**
```bash
git clone <repository-url>
cd feedbackhub/backend
```

### **2. Instalar dependências**
```bash
npm install
```

### **3. Configurar variáveis de ambiente**
Criar arquivo `.env` na raiz do backend:
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=sua-chave-secreta-aqui
```

### **4. Inicializar o banco de dados**
```bash
npm run migrate
npm run seed
```

### **5. Iniciar o servidor**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📚 API Endpoints

### **🔐 Autenticação**
```
POST   /api/auth/login              # Login de usuário
POST   /api/auth/register           # Registro de usuário
POST   /api/auth/forgot-password    # Recuperação de senha
POST   /api/auth/change-password    # Alteração de senha
GET    /api/auth/verify             # Verificar token
```

### **👥 Usuários**
```
GET    /api/users                   # Listar usuários
GET    /api/users/:id               # Buscar usuário
POST   /api/users                   # Criar usuário
PUT    /api/users/:id               # Atualizar usuário
DELETE /api/users/:id               # Desativar usuário
POST   /api/users/:id/activate      # Reativar usuário
POST   /api/users/:id/reset-password # Resetar senha
GET    /api/users/profile/me        # Meu perfil
PUT    /api/users/profile/me        # Atualizar perfil
GET    /api/users/departments/list  # Listar departamentos
GET    /api/users/roles/list        # Listar perfis
```

### **🎯 Feedbacks**
```
GET    /api/feedback                # Listar feedbacks
GET    /api/feedback/:id            # Buscar feedback
POST   /api/feedback                # Criar feedback
PUT    /api/feedback/:id            # Atualizar feedback
DELETE /api/feedback/:id            # Excluir feedback
POST   /api/feedback/:id/status     # Alterar status
POST   /api/feedback/:id/comments   # Adicionar comentário
POST   /api/feedback/:id/competency-ratings # Avaliar competências
GET    /api/feedback/types/list     # Listar tipos
GET    /api/feedback/competencies/list # Listar competências
```

### **👥 Equipes**
```
GET    /api/teams                   # Listar equipes
GET    /api/teams/:id               # Buscar equipe
POST   /api/teams                   # Criar equipe
PUT    /api/teams/:id               # Atualizar equipe
DELETE /api/teams/:id               # Excluir equipe
POST   /api/teams/:id/members       # Adicionar membro
DELETE /api/teams/:id/members/:member_id # Remover membro
PUT    /api/teams/:id/members/:member_id # Atualizar função
GET    /api/teams/my-teams/me       # Minhas equipes
```

### **📊 Relatórios**
```
GET    /api/reports/dashboard       # Dashboard geral
GET    /api/reports/feedback        # Relatório de feedbacks
GET    /api/reports/users           # Relatório de usuários
GET    /api/reports/teams           # Relatório de equipes
GET    /api/reports/performance     # Relatório de performance
GET    /api/reports/export/csv      # Exportar relatório
```

## 🔐 Sistema de Permissões

### **Administrador**
- ✅ **Acesso total** a todas as funcionalidades
- ✅ **Gestão completa** de usuários e equipes
- ✅ **Relatórios** de todo o sistema
- ✅ **Configurações** do sistema

### **Gestor**
- ✅ **Gestão de equipes** próprias
- ✅ **Visualização** de feedbacks da equipe
- ✅ **Relatórios** da equipe
- ✅ **Gestão de membros** da equipe

### **Usuário**
- ✅ **Feedbacks** próprios (enviados e recebidos)
- ✅ **Perfil pessoal** e estatísticas
- ✅ **Participação** em equipes
- ❌ **Sem acesso** a relatórios gerais

## 🛡️ Segurança

### **Autenticação**
- **JWT (JSON Web Tokens)** para sessões
- **Tokens expiram** em 24 horas
- **Refresh automático** de tokens

### **Validação**
- **Validação de entrada** com Joi
- **Sanitização** de dados
- **Prevenção** de SQL injection

### **Proteção**
- **Rate limiting** (100 requests/15min por IP)
- **Headers de segurança** com Helmet
- **CORS configurável**
- **Compressão** de respostas

### **Auditoria**
- **Logs de todas as ações** importantes
- **Rastreamento** de mudanças
- **Histórico** de acessos

## 📊 Monitoramento e Logs

### **Logs de Aplicação**
- **Morgan** para logs HTTP
- **Console logs** para desenvolvimento
- **Logs estruturados** para produção

### **Métricas**
- **Health check** endpoint
- **Estatísticas** de uso
- **Performance** monitoring

## 🧪 Testes

### **Executar Testes**
```bash
npm test
```

### **Cobertura de Testes**
```bash
npm run test:coverage
```

## 🚀 Deploy

### **Ambiente de Desenvolvimento**
```bash
npm run dev
```

### **Ambiente de Produção**
```bash
npm start
```

### **Variáveis de Produção**
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=chave-super-secreta-producao
DATABASE_URL=postgresql://user:pass@host:port/db
```

## 🔧 Scripts Disponíveis

```json
{
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "jest",
  "migrate": "node scripts/migrate.js",
  "seed": "node scripts/seed.js"
}
```

## 📝 Exemplos de Uso

### **Login de Usuário**
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@empresa.com',
    password: '123456'
  })
});

const { token, user } = await response.json();
```

### **Criar Feedback**
```javascript
const response = await fetch('/api/feedback', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    to_user_id: 2,
    type: 'Desempenho',
    title: 'Excelente trabalho no projeto',
    content: 'Demonstrou grande habilidade técnica...',
    rating: 9,
    priority: 'Alta'
  })
});
```

### **Buscar Relatórios**
```javascript
const response = await fetch('/api/reports/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const dashboardData = await response.json();
```

## 🤝 Contribuição

1. **Fork** o projeto
2. **Crie** uma branch para sua feature
3. **Commit** suas mudanças
4. **Push** para a branch
5. **Abra** um Pull Request

## 📄 Licença

Este projeto está licenciado sob a **MIT License**.

## 📞 Suporte

Para suporte e dúvidas:
- 📧 Email: suporte@feedbackhub.com
- 📱 WhatsApp: +55 (11) 99999-9999
- 🌐 Website: https://feedbackhub.com

## 🔮 Roadmap

### **Versão 1.1**
- [ ] **Sistema de notificações** por email
- [ ] **Dashboard mobile** responsivo
- [ ] **Integração** com Slack/Teams
- [ ] **API rate limiting** avançado

### **Versão 1.2**
- [ ] **Métricas avançadas** de performance
- [ ] **Sistema de metas** e KPIs
- [ ] **Relatórios automáticos** por email
- [ ] **Backup automático** do banco

### **Versão 2.0**
- [ ] **Migração para PostgreSQL**
- [ ] **Microserviços** arquitetura
- [ ] **Real-time** com WebSockets
- [ ] **Machine Learning** para insights

---

**Desenvolvido com ❤️ pela equipe FeedbackHub**

# FeedbackHub - Backend

Este é o backend da aplicação FeedbackHub, uma plataforma para gestão de feedbacks corporativos. A API é construída com Node.js, Express, e Prisma, seguindo as melhores práticas de desenvolvimento e segurança.

## Tecnologias Utilizadas

- **Node.js:** Ambiente de execução JavaScript.
- **Express.js:** Framework para construção de APIs.
- **Prisma ORM:** ORM para interação com o banco de dados PostgreSQL.
- **Supabase:** Plataforma que provê o banco de dados PostgreSQL.
- **JSON Web Tokens (JWT):** Para autenticação e autorização.
- **bcrypt.js:** Para hashing de senhas.
- **Joi:** Para validação de dados de entrada.
- **Winston:** Para logging da aplicação.
- **Swagger (swagger-jsdoc & swagger-ui-express):** Para documentação da API.
- **Helmet, CORS, express-rate-limit:** Para segurança da API.

## Estrutura do Projeto

```
/backend
|-- /prisma
|   |-- schema.prisma       # Schema do banco de dados
|   `-- migrations/         # Migrações do banco de dados
|-- /src
|   |-- /controllers        # Lógica de negócio
|   |-- /database           # Conexão com o banco
|   |-- /middlewares        # Middlewares (auth, error, etc)
|   |-- /routes             # Definição das rotas da API
|   |-- /utils              # Funções utilitárias (logger, jwt)
|   |-- /validators         # Schemas de validação Joi
|   `-- server.js           # Ponto de entrada da aplicação
|-- .env.example            # Exemplo de variáveis de ambiente
|-- package.json
`-- README.md
```

## Pré-requisitos

- Node.js (v16 ou superior)
- npm ou Yarn
- Uma instância de banco de dados PostgreSQL (ex: via Supabase)

## Instalação e Configuração

1.  **Clone o repositório:**

    ```bash
    git clone <url-do-repositorio>
    cd backend
    ```

2.  **Instale as dependências:**

    ```bash
    npm install
    # ou
    yarn install
    ```

3.  **Configure as variáveis de ambiente:**

    Crie um arquivo `.env` na raiz do projeto, copiando o conteúdo de `.env.example` e preenchendo com suas credenciais:

    ```env
    # Exemplo de .env
    DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
    JWT_SECRET="seu_segredo_jwt_super_secreto"
    JWT_EXPIRES_IN="1d"
    PORT=5000
    ```

4.  **Execute as migrações do Prisma:**

    Isso irá criar as tabelas no seu banco de dados com base no `schema.prisma`.

    ```bash
    npx prisma migrate dev --name init
    ```

5.  **Inicie o servidor:**

    ```bash
    npm start
    # ou para desenvolvimento com hot-reload
    npm run dev
    ```

## Documentação da API

Com o servidor em execução, a documentação interativa da API (Swagger) estará disponível em:

`http://localhost:5000/api-docs`

## Endpoints Principais

-   `POST /api/auth/register`: Registrar novo usuário.
-   `POST /api/auth/login`: Autenticar usuário.
-   `GET /api/auth/me`: Obter dados do usuário logado.
-   `GET /api/users`: Listar usuários (Admin/Gestor).
-   `POST /api/feedbacks`: Criar novo feedback.
-   `GET /api/feedbacks`: Listar feedbacks.
-   `GET /api/dashboard/stats`: Obter estatísticas do dashboard (Admin/Gestor).
-   `GET /api/settings`: Listar configurações do sistema (Admin).

Consulte a documentação no Swagger para ver todos os endpoints, parâmetros e corpos de requisição.
