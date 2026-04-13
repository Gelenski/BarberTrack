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
  res.sendFile(
    path.join(__dirname, "../public/pages/cadastro_cliente/index.html")
  );
});

router.post("/cadastro", async (req, res) => {
  const { nome, sobrenome, email, telefone, senha } = req.body;
  const cliente = { nome, sobrenome, email, telefone, senha };
  const validationError = validateClientePayload(cliente);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const emailJaCadastrado = await recordExists(db, "cliente", "email", email);

    if (emailJaCadastrado) {
      return res
        .status(409)
        .json({ error: responseMessages.duplicateClienteEmail });
    }

    const senhaHash = await bcrypt.hash(cliente.senha, 10);

    const [result] = await db.execute(
      "INSERT INTO cliente (barbearia_id, nome, sobrenome, email, telefone, senha) VALUES (1,?,?,?,?,?);",
      [
        cliente.nome,
        cliente.sobrenome,
        cliente.email,
        cliente.telefone,
        senhaHash,
      ]
    );

    return res.status(201).json({
      message: responseMessages.createdCliente,
      user: {
        id: result.insertId,
        nome: cliente.nome,
        email: cliente.email,
      },
    });
  } catch (error) {
    console.error("Erro no cadastro de cliente:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

router.get("/dashboard", isAuthenticated, isCliente, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/dashboard_cliente/index.html"));
});

module.exports = router;
