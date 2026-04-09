# 💈 BarberTrack

Sistema web para gerenciamento de barbearias com foco em agendamentos, controle de clientes e organização operacional.

---

## 📌 Sobre o Projeto

O **BarberTrack** é uma aplicação voltada para digitalizar e otimizar o gerenciamento de barbearias, permitindo:

- Cadastro e gerenciamento de clientes
- Gestão de barbeiros
- Controle de horários e disponibilidade
- Agendamento de serviços
- Estrutura multi-tenant (suporte a múltiplas barbearias)

A proposta é criar uma solução escalável, simples e eficiente para negócios locais.

---

## 🚀 Funcionalidades

- 👤 Cadastro de usuários (clientes e barbeiros)
- 🏪 Gestão de barbearias (multi-tenant)
- 📅 Sistema de agendamentos
- ⏰ Controle de horários de funcionamento
- 🔐 Sistema de autenticação (em desenvolvimento)
- 📊 Base para futura expansão (relatórios, pagamentos, etc.)

---

## 🏗️ Arquitetura do Projeto

O projeto segue uma estrutura modular visando escalabilidade:

```
barbertrack/
├── src/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   └── config/
├── database/
│   ├── migrations/
│   └── seeds/
├── tests/
├── .env.example
├── package.json
└── README.md
```

---

## 🧠 Modelagem de Dados

O sistema foi projetado com foco em:

- Normalização de dados
- Separação por entidades (Cliente, Barbeiro, Barbearia)
- Estrutura multi-tenant
- Escalabilidade futura

---

## 🛠️ Tecnologias Utilizadas

- Node.js
- Express
- Banco de dados relacional (MySQL/PostgreSQL)
- ORM (Prisma / Sequelize / TypeORM)
- JWT (autenticação futura)

---

## ⚙️ Como Rodar o Projeto

### 🔧 Pré-requisitos

- Node.js instalado
- Banco de dados (MySQL ou PostgreSQL)
- Git

---

### 📥 Clonando o repositório

```bash
git clone https://github.com/Gelenski/BarberTrack.git
cd BarberTrack
```

---

### 📦 Instalando dependências

```bash
npm install
```

---

### 🔐 Variáveis de ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
DATABASE_URL=
JWT_SECRET=
PORT=3000
```

---

### 🗄️ Configurando o banco

```bash
# Rodar migrations
npx prisma migrate dev

# Popular banco (opcional)
npx prisma db seed
```

---

### ▶️ Executando o projeto

```bash
npm run dev
```

---

## 🧪 Testes

```bash
npm run test
```

---

## 🤝 Contribuição

Contribuições são bem-vindas.

### 📌 Como contribuir

1. Faça um fork do projeto
2. Crie uma branch:

```bash
git checkout -b feature/minha-feature
```

3. Faça suas alterações
4. Commit:

```bash
git commit -m "feat: adiciona nova funcionalidade"
```

5. Push:

```bash
git push origin feature/minha-feature
```

6. Abra um Pull Request

---

### 📏 Padrões de commit

- feat: nova funcionalidade
- fix: correção de bug
- refactor: melhoria de código
- docs: documentação
- test: testes
- chore: tarefas gerais

---

## 👨‍💻 Autores

Adrian

Carlos (carlosLopes79)
https://github.com/carlosLopes79

Lucas (Gelenski)  
https://github.com/Gelenski
