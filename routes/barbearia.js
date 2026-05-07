const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("../db/db");
const { isAuthenticated, isBarbearia } = require("../middleware/auth");
const { recordExists } = require("../utils/dbChecks");
const { normalizeCnpj } = require("../utils/normalizers");
const responseMessages = require("../utils/responseMessages");
const { validateBarbeariaPayload } = require("../validators/barbearia");

const router = express.Router();

router.get("/cadastro", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../public/pages/cadastro_barbearia/index.html")
  );
});

router.post("/cadastro", async (req, res) => {
  const {
    nome_fantasia: nomeFantasia,
    razao_social: razaoSocial,
    cnpj,
    email,
    telefone,
    senha,
  } = req.body;

  const barbearia = {
    nomeFantasia,
    razaoSocial,
    cnpj,
    email,
    telefone,
    senha,
  };

  const validationError = validateBarbeariaPayload(barbearia);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    // As checagens sao separadas para preservar mensagens especificas por campo duplicado.
    if (email && (await recordExists(db, "barbearia", "email", email))) {
      return res
        .status(409)
        .json({ error: responseMessages.duplicateBarbeariaEmail });
    }

    if (
      telefone &&
      (await recordExists(db, "barbearia", "telefone", telefone))
    ) {
      return res
        .status(409)
        .json({ error: responseMessages.duplicateBarbeariaTelefone });
    }

    // O CNPJ e persistido sem mascara para padronizar comparacao e busca.
    const cnpjNormalizado = normalizeCnpj(cnpj);

    if (await recordExists(db, "barbearia", "cnpj", cnpjNormalizado)) {
      return res
        .status(409)
        .json({ error: responseMessages.duplicateBarbeariaCnpj });
    }

    const senhaHash = await bcrypt.hash(barbearia.senha, 10);

    const [result] = await db.execute(
      `
      INSERT INTO barbearia
        (nome_fantasia, razao_social, cnpj, email, telefone, senha)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        barbearia.nomeFantasia,
        barbearia.razaoSocial,
        cnpjNormalizado,
        barbearia.email || null,
        barbearia.telefone || null,
        senhaHash,
      ]
    );

    return res.status(201).json({
      message: responseMessages.createdBarbearia,
      barbearia: {
        id: result.insertId,
        nome_fantasia: barbearia.nomeFantasia,
        razao_social: barbearia.razaoSocial,
        cnpj: cnpjNormalizado,
        email: barbearia.email || null,
        telefone: barbearia.telefone || null,
      },
    });
  } catch (error) {
    console.error("Erro ao cadastrar barbearia:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

router.get("/dashboard", isAuthenticated, isBarbearia, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/dashboard_barbearia/index.html"));
});

router.get("/servicos", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/servicos_barbearia/index.html"));
})

module.exports = router;
