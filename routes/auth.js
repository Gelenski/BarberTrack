const express = require("express");
const path = require("path");
const router = express.Router();
const db = require("../db/db");
const bcrypt = require("bcrypt");

router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/login/index.html"));
});

router.post("/signin", async (req, res) => {
  try {
    const { nome, sobrenome, email, telefone, senha } = req.body;
    const [clienteExiste] = await db.execute(
      "SELECT id FROM cliente WHERE email = ?",
      [email]
    );

    if (clienteExiste.length > 0) {
      return res.status(409).json({
        error: "Email já cadastrado",
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

module.exports = router;
