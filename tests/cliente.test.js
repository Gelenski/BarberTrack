const request = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../app");
const db = require("../db/db");
const responseMessages = require("../utils/responseMessages");

jest.mock("../db/db");

describe("Fluxos criticos de autenticacao e cadastro", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /cliente/cadastro", () => {
    it("cadastra um cliente com sucesso", async () => {
      db.execute
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{ insertId: 1 }]);

      const response = await request(app).post("/cliente/cadastro").send({
        nome: "Lucas",
        sobrenome: "Silva",
        email: "lucas@email.com",
        telefone: "41999999999",
        senha: "12345678",
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe(responseMessages.createdCliente);
      expect(response.body.user).toEqual({
        id: 1,
        nome: "Lucas",
        email: "lucas@email.com",
      });
    });

    it("retorna erro quando faltam campos obrigatorios", async () => {
      const response = await request(app).post("/cliente/cadastro").send({
        nome: "Lucas",
        email: "lucas@email.com",
        telefone: "41999999999",
        senha: "12345678",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(responseMessages.requiredClienteFields);
      expect(db.execute).not.toHaveBeenCalled();
    });

    it("retorna erro quando o email ja existe", async () => {
      db.execute.mockResolvedValueOnce([[{ id: 1 }]]);

      const response = await request(app).post("/cliente/cadastro").send({
        nome: "Lucas",
        sobrenome: "Silva",
        email: "lucas@email.com",
        telefone: "41999999999",
        senha: "12345678",
      });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe(responseMessages.duplicateClienteEmail);
    });
  });

  describe("POST /barbearia/cadastro", () => {
    it("cadastra uma barbearia com sucesso", async () => {
      db.execute
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{ insertId: 4 }]);

      const response = await request(app).post("/barbearia/cadastro").send({
        nome_fantasia: "Barber Prime",
        razao_social: "Barber Prime LTDA",
        cnpj: "12.345.678/0001-90",
        email: "contato@barberprime.com",
        telefone: "41999999999",
        senha: "12345678",
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe(responseMessages.createdBarbearia);
      expect(response.body.barbearia).toEqual({
        id: 4,
        nome_fantasia: "Barber Prime",
        razao_social: "Barber Prime LTDA",
        cnpj: "12345678000190",
        email: "contato@barberprime.com",
        telefone: "41999999999",
      });
    });

    it("retorna erro para cnpj invalido", async () => {
      const response = await request(app).post("/barbearia/cadastro").send({
        nome_fantasia: "Barber Prime",
        razao_social: "Barber Prime LTDA",
        cnpj: "123",
        email: "contato@barberprime.com",
        telefone: "41999999999",
        senha: "12345678",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(responseMessages.invalidCnpj);
      expect(db.execute).not.toHaveBeenCalled();
    });

    it("retorna erro para telefone invalido", async () => {
      const response = await request(app).post("/barbearia/cadastro").send({
        nome_fantasia: "Barber Prime",
        razao_social: "Barber Prime LTDA",
        cnpj: "12.345.678/0001-90",
        email: "contato@barberprime.com",
        telefone: "12345",
        senha: "12345678",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(responseMessages.invalidTelefone);
      expect(db.execute).not.toHaveBeenCalled();
    });

    it("retorna erro quando o email ja existe", async () => {
      db.execute.mockResolvedValueOnce([[{ id: 9 }]]);

      const response = await request(app).post("/barbearia/cadastro").send({
        nome_fantasia: "Barber Prime",
        razao_social: "Barber Prime LTDA",
        cnpj: "12.345.678/0001-90",
        email: "contato@barberprime.com",
        telefone: "41999999999",
        senha: "12345678",
      });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe(
        responseMessages.duplicateBarbeariaEmail
      );
    });

    it("retorna erro quando o telefone ja existe", async () => {
      db.execute
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ id: 10 }]]);

      const response = await request(app).post("/barbearia/cadastro").send({
        nome_fantasia: "Barber Prime",
        razao_social: "Barber Prime LTDA",
        cnpj: "12.345.678/0001-90",
        email: "contato@barberprime.com",
        telefone: "41999999999",
        senha: "12345678",
      });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe(
        responseMessages.duplicateBarbeariaTelefone
      );
    });

    it("retorna erro quando o cnpj ja existe", async () => {
      db.execute
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ id: 11 }]]);

      const response = await request(app).post("/barbearia/cadastro").send({
        nome_fantasia: "Barber Prime",
        razao_social: "Barber Prime LTDA",
        cnpj: "12.345.678/0001-90",
        email: "contato@barberprime.com",
        telefone: "41999999999",
        senha: "12345678",
      });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe(responseMessages.duplicateBarbeariaCnpj);
    });
  });

  describe("Fluxo de cadastro de barbeiro", () => {
    it("mantem o login de barbearia redirecionando para o dashboard", async () => {
      const senhaHash = await bcrypt.hash("12345678", 10);

      db.execute.mockResolvedValueOnce([
        [
          {
            id: 2,
            nome: "Barber Prime",
            email: "contato@barberprime.com",
            senha: senhaHash,
          },
        ],
      ]);

      const response = await request(app).post("/auth/login").send({
        email: "contato@barberprime.com",
        senha: "12345678",
        tipo: "barbearia",
      });

      expect(response.status).toBe(200);
      expect(response.body.redirect).toBe("/barbearia/dashboard");
    });

    it("exibe no dashboard da barbearia o atalho para cadastrar barbeiro", async () => {
      const agent = request.agent(app);
      const senhaHash = await bcrypt.hash("12345678", 10);

      db.execute.mockResolvedValueOnce([
        [
          {
            id: 2,
            nome: "Barber Prime",
            email: "contato@barberprime.com",
            senha: senhaHash,
          },
        ],
      ]);

      await agent.post("/auth/login").send({
        email: "contato@barberprime.com",
        senha: "12345678",
        tipo: "barbearia",
      });

      const response = await agent.get("/barbearia/dashboard");

      expect(response.status).toBe(200);
      expect(response.text).toContain("Cadastrar Barbeiro");
      expect(response.text).toContain('href="/barbeiro/cadastro"');
    });

    it("permite que a barbearia logada cadastre um barbeiro com a FK correta", async () => {
      const agent = request.agent(app);
      const senhaHash = await bcrypt.hash("12345678", 10);
      const senhaBarbeiro = "abcdef12";

      db.execute
        .mockResolvedValueOnce([
          [
            {
              id: 7,
              nome: "Barber Prime",
              email: "contato@barberprime.com",
              senha: senhaHash,
            },
          ],
        ])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{ insertId: 12 }]);

      await agent.post("/auth/login").send({
        email: "contato@barberprime.com",
        senha: "12345678",
        tipo: "barbearia",
      });

      const response = await agent.post("/barbeiro/cadastro").send({
        nome: "Joao",
        sobrenome: "Silva",
        email: "joao@barberprime.com",
        telefone: "(41) 99999-9999",
        cpf: "123.456.789-00",
        senha: senhaBarbeiro,
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: responseMessages.createdBarbeiro,
        barbeiro: {
          id: 12,
          barbearia_id: 7,
          nome: "Joao",
          sobrenome: "Silva",
          cpf: "12345678900",
          email: "joao@barberprime.com",
          telefone: "41999999999",
        },
      });
      expect(db.execute).toHaveBeenLastCalledWith(
        expect.stringContaining("INSERT INTO barbeiro"),
        [
          7,
          "Joao",
          "Silva",
          "12345678900",
          "joao@barberprime.com",
          "41999999999",
          expect.any(String),
        ]
      );
      expect(
        await bcrypt.compare(senhaBarbeiro, db.execute.mock.calls[3][1][6])
      ).toBe(true);
    });

    it("redireciona para o login quando tenta abrir o cadastro de barbeiro sem sessao", async () => {
      const response = await request(app).get("/barbeiro/cadastro");

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe("/auth/login");
    });

    it("bloqueia cliente autenticado de acessar o cadastro de barbeiro", async () => {
      const agent = request.agent(app);
      const senhaHash = await bcrypt.hash("12345678", 10);

      db.execute.mockResolvedValueOnce([
        [
          {
            id: 1,
            nome: "Lucas",
            email: "lucas@email.com",
            senha: senhaHash,
          },
        ],
      ]);

      await agent.post("/auth/login").send({
        email: "lucas@email.com",
        senha: "12345678",
        tipo: "cliente",
      });

      const getResponse = await agent.get("/barbeiro/cadastro");
      const postResponse = await agent.post("/barbeiro/cadastro").send({
        nome: "Joao",
        sobrenome: "Silva",
        email: "joao@email.com",
        telefone: "41999999999",
        cpf: "12345678900",
        senha: "12345678",
      });

      expect(getResponse.status).toBe(403);
      expect(postResponse.status).toBe(403);
    });

    it("retorna erro quando faltam campos obrigatorios no cadastro do barbeiro", async () => {
      const agent = request.agent(app);
      const senhaHash = await bcrypt.hash("12345678", 10);

      db.execute.mockResolvedValueOnce([
        [
          {
            id: 7,
            nome: "Barber Prime",
            email: "contato@barberprime.com",
            senha: senhaHash,
          },
        ],
      ]);

      await agent.post("/auth/login").send({
        email: "contato@barberprime.com",
        senha: "12345678",
        tipo: "barbearia",
      });

      const response = await agent.post("/barbeiro/cadastro").send({
        nome: "Joao",
        email: "joao@barberprime.com",
        senha: "12345678",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(responseMessages.requiredBarbeiroFields);
    });

    it("retorna erro quando o cpf do barbeiro ja existe", async () => {
      const agent = request.agent(app);
      const senhaHash = await bcrypt.hash("12345678", 10);

      db.execute
        .mockResolvedValueOnce([
          [
            {
              id: 7,
              nome: "Barber Prime",
              email: "contato@barberprime.com",
              senha: senhaHash,
            },
          ],
        ])
        .mockResolvedValueOnce([[{ id: 55 }]]);

      await agent.post("/auth/login").send({
        email: "contato@barberprime.com",
        senha: "12345678",
        tipo: "barbearia",
      });

      const response = await agent.post("/barbeiro/cadastro").send({
        nome: "Joao",
        sobrenome: "Silva",
        email: "joao@barberprime.com",
        telefone: "41999999999",
        cpf: "12345678900",
        senha: "12345678",
      });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe(responseMessages.duplicateBarbeiroCpf);
    });
  });

  describe("POST /auth/login", () => {
    it("faz login com sucesso para cliente e persiste a sessao", async () => {
      const senhaHash = await bcrypt.hash("12345678", 10);
      const agent = request.agent(app);

      db.execute.mockResolvedValueOnce([
        [
          {
            id: 1,
            nome: "Lucas",
            email: "lucas@email.com",
            senha: senhaHash,
          },
        ],
      ]);

      const loginResponse = await agent.post("/auth/login").send({
        email: "lucas@email.com",
        senha: "12345678",
        tipo: "cliente",
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toMatchObject({
        success: true,
        redirect: "/cliente/dashboard",
        nome: "Lucas",
      });

      const sessionResponse = await agent.get("/teste-user");
      expect(sessionResponse.status).toBe(200);
      expect(sessionResponse.body.user).toEqual({
        id: 1,
        nome: "Lucas",
        tipo: "cliente",
        email: "lucas@email.com",
      });
    });

    it("faz login com sucesso para barbearia", async () => {
      const senhaHash = await bcrypt.hash("12345678", 10);

      db.execute.mockResolvedValueOnce([
        [
          {
            id: 2,
            nome: "Barber Prime",
            email: "contato@barberprime.com",
            senha: senhaHash,
          },
        ],
      ]);

      const response = await request(app).post("/auth/login").send({
        email: "contato@barberprime.com",
        senha: "12345678",
        tipo: "barbearia",
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        redirect: "/barbearia/dashboard",
        nome: "Barber Prime",
      });
    });

    it("retorna erro quando o usuario nao existe", async () => {
      db.execute.mockResolvedValueOnce([[]]);

      const response = await request(app).post("/auth/login").send({
        email: "naoexiste@email.com",
        senha: "12345678",
        tipo: "cliente",
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe(responseMessages.userNotFound);
    });

    it("retorna erro quando a senha esta incorreta", async () => {
      const senhaHash = await bcrypt.hash("12345678", 10);

      db.execute.mockResolvedValueOnce([
        [
          {
            id: 1,
            nome: "Lucas",
            email: "lucas@email.com",
            senha: senhaHash,
          },
        ],
      ]);

      const response = await request(app).post("/auth/login").send({
        email: "lucas@email.com",
        senha: "senhaErrada",
        tipo: "cliente",
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe(responseMessages.invalidCredentials);
    });
  });
});
