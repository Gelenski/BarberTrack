const express = require("express");
const path = require("path");
const router = express.Router();
const db = require("../db/db");
const bcrypt = require("bcrypt");

router.get("/cadastro", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../public/pages/cadastro_cliente/index.html")
  );
});

router.post("/cadastro", async (req, res) => {
  try {
    const { nome, sobrenome, email, telefone, senha } = req.body;

    if (!nome || nome.length < 2 || !/^[A-Za-zÀ-ÿ\s'-]+$/.test(nome.trim())) {
      return res.status(400).json({ error: "Nome inválido." });
    }
    if (
      !sobrenome ||
      sobrenome.length < 2 ||
      !/^[A-Za-zÀ-ÿ\s'-]+$/.test(sobrenome.trim())
    ) {
      return res.status(400).json({ error: "Sobrenome inválido." });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      return res.status(400).json({ error: "Email inválido." });
    }
    const digits = telefone?.replace(/\D/g, "");
    if (!digits || digits.length < 10 || digits.length > 11) {
      return res.status(400).json({ error: "Telefone inválido." });
    }
    if (!senha || senha.length < 8) {
      return res
        .status(400)
        .json({ error: "Senha deve ter no mínimo 8 caracteres." });
    }

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
    console.error("Detalhes do erro:", erro.message);
    console.error("Erro no cadastro:", erro);
    return res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
});

module.exports = router;
