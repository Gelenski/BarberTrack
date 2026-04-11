const express = require("express");
const path = require("path");
const router = express.Router();
const db = require("../db/db");
const bcrypt = require("bcrypt");
const createSession = require("../utils/createSession");

router.get("/cadastro", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../public/pages/cadastro_cliente/index.html")
  );
});

// * --- ROTA DE CADASTRO DE CLIENTE ---

router.post("/cadastro", async (req, res) => {
  try {
    const { nome, sobrenome, email, telefone, senha } = req.body;

    if (!nome || !sobrenome || !email || !telefone || !senha) {
      return res.status(400).json({
        error: "Todos os campos são obrigatórios.",
      });
    }

    const [clienteExiste] = await db.execute(
      "SELECT id FROM cliente WHERE email = ?",
      [email]
    );

    if (clienteExiste.length > 0) {
      return res.status(409).json({
        error: "Email já cadastrado.",
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const [result] = await db.execute(
      "INSERT INTO cliente (barbearia_id, nome, sobrenome, email, telefone, senha) VALUES (1,?,?,?,?,?);",
      [nome, sobrenome, email, telefone, senhaHash]
    );

    return res.status(201).json({
      message: "Usuário cadastrado com sucesso.",
      user: {
        id: result.insertId,
        nome,
        email,
      },
    });
  } catch (erro) {
    console.error("Erro no cadastro:", erro);
    return res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
});

// * --- ROTA DE LOGIN DE CLIENTE ---

router.post("/login", async (req, res) => {
  try {
    let { email, senha } = req.body;

    email = email.trim().toLowerCase();
    senha = senha.trim();

    if (!email || !senha) {
      return res.status(400).json({
        error: "Email e senha são obrigatórios.",
      });
    }

    const [result] = await db.execute(
      "SELECT id, nome, email, senha FROM cliente WHERE email = ?",
      [email]
    );

    if (result.length === 0) {
      return res.status(401).json({
        error: "Email ou senha inválidos.",
      });
    }

    const user = result[0];

    const senhaCorreta = await bcrypt.compare(senha, user.senha);

    if (!senhaCorreta) {
      return res.status(401).json({
        error: "Email ou senha inválidos.",
      });
    }

    const safeUser = {
      id: user.id,
      nome: user.nome,
      email: user.email,
    };

    // * Criação da sessão ao login
    createSession(req, safeUser, "cliente", (err) => {
      if (err) {
        console.error("Erro ao iniciar sessão:", err);
        return res.status(500).json({
          error: "Erro ao iniciar sessão",
        });
      }

      return res.status(200).json({
        message: "Login realizado com sucesso.",
        user: safeUser,
      });
    });
  } catch (erro) {
    console.log("Erro interno no login do cliente:", erro);
    return res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
});

module.exports = router;
