const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("../db/db");
const createSession = require("../utils/createSession");

router.get("/cadastro", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../public/pages/cadastro_barbearia/index.html")
  );
});

router.post("/cadastro", async (req, res) => {
  try {
    const { nome_fantasia, razao_social, cnpj, email, telefone, senha } =
      req.body;

    //implementação de verificação email e telefone

    const [emailExistente] = await db.execute(
      "SELECT id FROM barbearia WHERE email = ?",
      [email]
    );
    if (emailExistente.length > 0) {
      return res.status(409).json({
        error: "Email informado já está em uso",
      });
    }

    const [telefoneExistente] = await db.execute(
      "SELECT id FROM barbearia WHERE telefone = ?",
      [telefone]
    );
    if (telefoneExistente.length > 0) {
      return res.status(409).json({
        error: "Telefone informado já está em uso",
      });
    }

    //fim da nova implementação teste

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
        error: "Cnpj já cadastrado",
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

    const [rows] = await db.execute(
      "SELECT id, nome_fantasia, email, senha FROM barbearia WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Email ou senha incorretos" });
    }

    const barbearia = rows[0];

    const senhaValida = await bcrypt.compare(senha, barbearia.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: "Email ou senha incorretos" });
    }

    const safeBarbearia = {
      id: barbearia.id,
      nome: barbearia.nome_fantasia,
      email: barbearia.email,
    };

    // * Criação da sessão ao login
    createSession(req, safeBarbearia, "barbearia", (err) => {
      if (err) {
        console.error("Erro ao iniciar sessão:", err);
        return res.status(500).json({
          error: "Erro ao iniciar sessão",
        });
      }

      return res.status(200).json({
        message: "Login realizado com sucesso.",
        user: safeBarbearia,
      });
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

module.exports = router;
