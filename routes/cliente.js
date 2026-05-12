const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("../db/db");
const { isAuthenticated, isCliente } = require("../middleware/auth");
const { recordExists } = require("../utils/dbChecks");
const responseMessages = require("../utils/responseMessages");
const { validateRegisterClientePayload } = require("../validators/cliente");

const router = express.Router();

router.get("/cadastro", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../public/pages/cadastro_cliente/index.html")
  );
});

router.post("/cadastro", async (req, res) => {
  const { nome, sobrenome, email, telefone, senha, barbeariasIds } = req.body;
  const cliente = { nome, sobrenome, email, telefone, senha, barbeariasIds };
  const validationError = validateRegisterClientePayload(cliente);

  const connection = await db.getConnection();

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    await connection.beginTransaction();
    // Validamos unicidade antes do insert para responder com erro de negocio mais claro.
    const emailJaCadastrado = await recordExists(
      connection,
      "cliente",
      "email",
      email
    );

    if (emailJaCadastrado) {
      return res
        .status(409)
        .json({ error: responseMessages.duplicateClienteEmail });
    }

    const senhaHash = await bcrypt.hash(cliente.senha, 10);

    // Primeira query para inserção dos dados na tabela cliente
    const [result1] = await connection.execute(
      "INSERT INTO cliente (nome, sobrenome, email, telefone, senha) VALUES (?,?,?,?,?);",
      [
        cliente.nome,
        cliente.sobrenome,
        cliente.email,
        cliente.telefone,
        senhaHash,
      ]
    );

    const clienteId = result1.insertId;

    const values = barbeariasIds.map((barbeariaId) => [barbeariaId, clienteId]);
    // Segunda query de inserção dos d  ados na tabela de relacionamento entre clientes e barbearias
    await connection.query(
      `INSERT INTO cliente_barbearias
      (barbearia_id, cliente_id)
      VALUES ?`,
      [values]
    );

    await connection.commit();

    return res.status(201).json({
      message: responseMessages.createdCliente,
      user: {
        id: result1.insertId,
        nome: cliente.nome,
        email: cliente.email,
        barbeariasIds: cliente.barbeariasIds,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Erro no cadastro de cliente:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  } finally {
    connection.release();
  }
});

router.post(
  "/cliente-barbearia",
  isAuthenticated,
  isCliente,
  async (req, res) => {
    const cliente = req.body.cliente_id;
    const barbearias = req.body.barbearias;

    try {
      if (!Array.isArray(barbearias) || barbearias.length == 0) {
        return res.status(400).json({
          erros: responseMessages.invalidBarbearias,
        });
      }

      for (const barbearia of barbearias) {
        await db.execute(
          `
          INSERT INTO cliente_barbearias 
          (barbearia_id, cliente_id) 
          VALUES (?, ?)
          `,
          [barbearia, cliente]
        );
      }
      return res.status(201).json({
        message: responseMessages.linkedCliente,
      });
    } catch (error) {
      console.log("Erro ao linkar cliente à uma barbearia:", error);
      return res
        .status(500)
        .json({ error: responseMessages.internalServerError });
    }
  }
);

router.get("/dashboard", isAuthenticated, isCliente, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/dashboard_cliente/index.html"));
});

router.get("/horarios", isAuthenticated, isCliente, async (req, res) => {
  try {
    const [horarios] = await db.execute(
      `SELECT dia_semana, abertura, fechamento, fechado
       FROM horario_funcionamento
       WHERE barbearia_id = (
         SELECT barbearia_id FROM cliente WHERE id = ?
       )
       ORDER BY dia_semana`,
      [req.session.user.id]
    );

    return res.json({ horarios });
  } catch (error) {
    console.error("Erro ao buscar horários:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

module.exports = router;
