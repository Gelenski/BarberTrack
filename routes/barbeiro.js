const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("../db/db");
const { isAuthenticated, isCliente } = require("../middleware/auth");
const { recordExists } = require("../utils/dbChecks");
const responseMessages = require("../utils/responseMessages");
const { validateClientePayload } = require("../validators/cliente");

const router = express.Router();

router.get("/cadastro", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/cadastro_barbeiro/index.html"));
});

router.post("/cadastro", async (req, res) => {
  const { nome, sobrenome, email, telefone, cpf } = req.body;
  const barbeiro = { nome, sobrenome, email, telefone, cpf };
  const validationError = validateClientePayload(barbeiro);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    // Validamos unicidade antes do insert para responder com erro de negocio mais claro.
    const emailJaCadastrado = await recordExists(db, "cliente", "email", email);

    if (emailJaCadastrado) {
      return res
        .status(409)
        .json({ error: responseMessages.duplicateClienteEmail });
    }

    // TODO: Alterar para o cliente selecionar qual barbearia é cliente desde o login, podendo ser mais de uma etc.

    const [result] = await db.execute(
      "INSERT INTO barbeiro (nome, sobrenome, email, telefone, cpf) VALUES (?,?,?,?,?,?);",
      [
        barbeiro.nome,
        barbeiro.sobrenome,
        barbeiro.email,
        barbeiro.telefone,
        barbeiro.cpf,
      ]
    );

    return res.status(201).json({
      message: responseMessages.createdCliente,
      user: {
        id: result.insertId,
        nome: barbeiro.nome,
        email: barbeiro.email,
      },
    });
  } catch (error) {
    console.error("Erro no cadastro de barbeiro:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

router.get("/dashboard", isAuthenticated, isCliente, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/dashboard_cliente/index.html"));
});

module.exports = router;
