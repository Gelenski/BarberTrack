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

router.get("/listar", async (req, res) => {
  try {
    const [result] = await db.execute("SELECT nome_fantasia FROM barbearia;");

    return res.status(200).json({
      message: result,
    });
  } catch (error) {
    console.log("Erro ao listar barbearias:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

router.get("/dashboard", isAuthenticated, isBarbearia, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/dashboard_barbearia/index.html"));
});

// ─── Rota para exibir os horários de funcionamento da barbearia logada e permitir edição  ADICIONADO POR ULTIMO

const { validateHorariosPayload } = require("../validators/horario");

// ─── Buscar horários da própria barbearia
router.get("/horarios", isAuthenticated, isBarbearia, async (req, res) => {
  try {
    const [horarios] = await db.execute(
      `SELECT dia_semana, abertura, fechamento, fechado
       FROM horario_funcionamento
       WHERE barbearia_id = ?
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

// ─── Salvar/atualizar horários da própria barbearia
router.post("/horarios", isAuthenticated, isBarbearia, async (req, res) => {
  const { horarios } = req.body;

  const validationError = validateHorariosPayload(horarios);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    // Upsert: atualiza se já existe, insere se não existe
    // INSERT ... ON DUPLICATE KEY UPDATE aproveita o UNIQUE KEY que criamos na tabela
    for (const horario of horarios) {
      await db.execute(
        `INSERT INTO horario_funcionamento
           (barbearia_id, dia_semana, abertura, fechamento, fechado)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           abertura = VALUES(abertura),
           fechamento = VALUES(fechamento),
           fechado = VALUES(fechado)`,
        [
          req.session.user.id,
          horario.dia_semana,
          horario.fechado ? null : horario.abertura,
          horario.fechado ? null : horario.fechamento,
          horario.fechado ? true : false,
        ]
      );
    }

    return res.json({ message: responseMessages.createdHorarios });
  } catch (error) {
    console.error("Erro ao salvar horários:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

module.exports = router;
