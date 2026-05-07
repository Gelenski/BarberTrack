const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("../db/db");
const { isAuthenticated, isBarbearia } = require("../middleware/auth");
const { recordExists } = require("../utils/dbChecks");
const { normalizeDigits, normalizeTelefone } = require("../utils/normalizers");
const responseMessages = require("../utils/responseMessages");
const { validateBarbeiroPayload } = require("../validators/barbeiro");

const router = express.Router();

router.get("/cadastro", isAuthenticated, isBarbearia, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/cadastro_barbeiro/index.html"));
});

router.post("/cadastro", isAuthenticated, isBarbearia, async (req, res) => {
  const { nome, sobrenome, email, telefone, cpf, senha } = req.body;
  const barbeiro = {
    nome: String(nome || "").trim(),
    sobrenome: String(sobrenome || "").trim(),
    email: String(email || "").trim(),
    telefone: normalizeTelefone(telefone),
    cpf: normalizeDigits(cpf),
    senha: String(senha || ""),
  };

  const validationError = validateBarbeiroPayload(barbeiro);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const cpfJaCadastrado = await recordExists(
      db,
      "barbeiro",
      "cpf",
      barbeiro.cpf
    );

    if (cpfJaCadastrado) {
      return res
        .status(409)
        .json({ error: responseMessages.duplicateBarbeiroCpf });
    }

    const emailJaCadastrado = await recordExists(
      db,
      "barbeiro",
      "email",
      barbeiro.email
    );

    if (emailJaCadastrado) {
      return res
        .status(409)
        .json({ error: responseMessages.duplicateBarbeiroEmail });
    }

    const senhaHash = await bcrypt.hash(barbeiro.senha, 10);

    const [result] = await db.execute(
      `
      INSERT INTO barbeiro
        (barbearia_id, nome, sobrenome, cpf, email, telefone, senha)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        req.session.user.id,
        barbeiro.nome,
        barbeiro.sobrenome,
        barbeiro.cpf,
        barbeiro.email,
        barbeiro.telefone,
        senhaHash,
      ]
    );

    return res.status(201).json({
      message: responseMessages.createdBarbeiro,
      barbeiro: {
        id: result.insertId,
        barbearia_id: req.session.user.id,
        nome: barbeiro.nome,
        sobrenome: barbeiro.sobrenome,
        cpf: barbeiro.cpf,
        email: barbeiro.email,
        telefone: barbeiro.telefone,
      },
    });
  } catch (error) {
    console.error("Erro no cadastro de barbeiro:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

router.get("/agenda", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/agenda_barbeiro/index.html"));
});

module.exports = router;
