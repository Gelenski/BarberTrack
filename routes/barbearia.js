const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("../db/db");

router.get("/cadastro", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../public/pages/cadastro_barbearia/index.html")
  );
});

router.post("/cadastro", async (req, res) => {
  try {
    const { nome_fantasia, razao_social, cnpj, email, telefone, senha } =
      req.body;

    if (!nome_fantasia || !razao_social || !cnpj || !senha) {
      return res.status(400).json({
        error: "nome_fantasia, razao_social, cnpj e senha são obrigatórios",
      });
    }

    const cnpjLimpo = String(cnpj).replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) {
      return res.status(400).json({
        error: "CNPJ inválido. Ele deve conter 14 dígitos.",
      });
    }

    if (senha.length < 6) {
      return res.status(400).json({
        error: "A senha deve ter pelo menos 6 caracteres",
      });
    }

    const [barbeariaExistente] = await db.execute(
      "SELECT id FROM barbearia WHERE cnpj = ?",
      [cnpjLimpo]
    );

    if (barbeariaExistente.length > 0) {
      return res.status(409).json({
        error: "Barbearia já cadastrada",
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const [result] = await db.execute(
      `
      INSERT INTO barbearia
        (nome_fantasia, razao_social, cnpj, email, telefone, senha)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        nome_fantasia,
        razao_social,
        cnpjLimpo,
        email || null,
        telefone || null,
        senhaHash,
      ]
    );

    return res.status(201).json({
      message: "Barbearia cadastrada com sucesso",
      barbearia: {
        id: result.insertId,
        nome_fantasia,
        razao_social,
        cnpj: cnpjLimpo,
        email: email || null,
        telefone: telefone || null,
      },
    });
  } catch (erro) {
    console.error("Erro ao cadastrar barbearia:", erro);
    return res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
});

router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/login/index.html"));
});

router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    const [rows] = await db.execute("SELECT * FROM barbearia WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ error: "Email ou senha incorretos" });
    }

    const barbearia = rows[0];

    const senhaValida = await bcrypt.compare(senha, barbearia.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: "Email ou senha incorretos" });
    }

    return res.status(200).json({
      message: "Login realizado com sucesso!",
      barbearia: { id: barbearia.id, nome: barbearia.nome },
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

module.exports = router;
