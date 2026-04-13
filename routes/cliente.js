const express = require("express");
const path = require("path");
const router = express.Router();
const db = require("../db/db");
const bcrypt = require("bcrypt");
const { isAuthenticated, isCliente } = require("../middleware/auth");
//const createSession = require("../utils/createSession");

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

router.get("/dashboard", isAuthenticated, isCliente, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/dashboard_cliente/index.html"));
});

module.exports = router;
