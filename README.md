# BarberTrack

Sistema web para gerenciamento de barbearias com foco em autenticacao, cadastro e organizacao operacional.

## Estrutura atual

O projeto hoje esta organizado em uma estrutura simples baseada em Express:

```text
barbertrack/
|-- app.js
|-- server.js
|-- db/
|-- middleware/
|-- public/
|-- routes/
|-- tests/
|-- utils/
`-- validators/
```

## Funcionalidades atuais

- Login para cliente e barbearia
- Cadastro de cliente
- Cadastro de barbearia
- Dashboard protegido por sessao para cada perfil

## Tecnologias

- Node.js
- Express
- MySQL
- Jest
- Supertest
- ESLint
- Prettier

## Como rodar

1. Instale as dependencias:

```bash
npm install
```

2. Crie o arquivo `.env` com base em `.env.example`.

3. Inicie a aplicacao:

```bash
npm run dev
```

## Scripts

```bash
npm start
npm run dev
npm test
npm run lint
npm run format
```

## Testes

Os testes cobrem os fluxos criticos do backend:

- autenticacao
- cadastro de cliente
- cadastro de barbearia
- middlewares de autorizacao
- normalizacao e validacao de payloads
