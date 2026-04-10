const request = require("supertest");
const app = require("../app");
const db = require("../db/db");
const bcrypt = require("bcrypt");

jest.mock("../db/db");

describe("Rotas de Cliente", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // * TESTE DE CADASTRO

  describe("POST /cliente/cadastro", () => {
    it("deve cadastrar um usuário com sucesso", async () => {
      db.execute
        .mockResolvedValueOnce([[]]) // SELECT (email não existe)
        .mockResolvedValueOnce([{ insertId: 1 }]); // INSERT

      const res = await request(app).post("/cliente/cadastro").send({
        nome: "Lucas",
        sobrenome: "Silva",
        email: "lucas@email.com",
        telefone: "41999999999",
        senha: "123456",
      });

      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty("id");
      expect(res.body.user.email).toBe("lucas@email.com");
    });

    it("deve retornar erro se email já existe", async () => {
      db.execute.mockResolvedValueOnce([[{ id: 1 }]]); // email já existe

      const res = await request(app).post("/cliente/cadastro").send({
        nome: "Lucas",
        sobrenome: "Silva",
        email: "lucas@email.com",
        telefone: "41999999999",
        senha: "123456",
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Email já cadastrado.");
    });
  });

  // * TESTE DE LOGIN

  describe("POST /cliente/login", () => {
    it("deve fazer login com sucesso", async () => {
      const senhaHash = await bcrypt.hash("123456", 10);

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

      const res = await request(app).post("/cliente/login").send({
        email: "lucas@email.com",
        senha: "123456",
      });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("lucas@email.com");
    });

    it("deve retornar erro se usuário não existe", async () => {
      db.execute.mockResolvedValueOnce([[]]);

      const res = await request(app).post("/cliente/login").send({
        email: "naoexiste@email.com",
        senha: "123456",
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Email ou senha inválidos.");
    });

    it("deve retornar erro se senha estiver errada", async () => {
      const senhaHash = await bcrypt.hash("123456", 10);

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

      const res = await request(app).post("/cliente/login").send({
        email: "lucas@email.com",
        senha: "senhaErrada",
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Email ou senha inválidos.");
    });
  });
});
