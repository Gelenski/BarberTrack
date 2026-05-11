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

// ─── Cadastro

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

  const barbearia = { nomeFantasia, razaoSocial, cnpj, email, telefone, senha };
  const validationError = validateBarbeariaPayload(barbearia);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
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

    const cnpjNormalizado = normalizeCnpj(cnpj);

    if (await recordExists(db, "barbearia", "cnpj", cnpjNormalizado)) {
      return res
        .status(409)
        .json({ error: responseMessages.duplicateBarbeariaCnpj });
    }

    const senhaHash = await bcrypt.hash(barbearia.senha, 10);

    const [result] = await db.execute(
      `INSERT INTO barbearia (nome_fantasia, razao_social, cnpj, email, telefone, senha)
       VALUES (?, ?, ?, ?, ?, ?)`,
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

// ─── Dashboard

router.get("/dashboard", isAuthenticated, isBarbearia, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/dashboard_barbearia/index.html"));
});

// ─── Serviços

router.get("/servicos", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/servicos_barbearia/index.html"));
});

// ─── Agenda (página)

router.get("/agenda", isAuthenticated, isBarbearia, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/agenda_barbearia/index.html"));
});

// ─── Agendamentos (API JSON) — listagem com filtros por data e barbeiro

router.get(
  "/agenda/agendamentos",
  isAuthenticated,
  isBarbearia,
  async (req, res) => {
    const barbeariaId = req.session.user.id;
    const { data, barbeiro_id } = req.query;
    const dataFiltro = data || new Date().toISOString().split("T")[0];

    try {
      let query = `
      SELECT
        a.id,
        a.horario,
        a.status,
        a.observacao,
        CONCAT(c.nome, ' ', c.sobrenome)   AS cliente_nome,
        c.telefone                          AS cliente_telefone,
        CONCAT(b.nome, ' ', b.sobrenome)   AS barbeiro_nome,
        b.id                               AS barbeiro_id,
        s.nome                             AS servico_nome,
        s.duracao_min,
        s.preco
      FROM agendamento a
      JOIN cliente  c ON c.id = a.cliente_id
      JOIN barbeiro b ON b.id = a.barbeiro_id
      JOIN servico  s ON s.id = a.servico_id
      WHERE a.barbearia_id = ?
        AND DATE(a.horario) = ?
    `;

      const params = [barbeariaId, dataFiltro];

      if (barbeiro_id) {
        query += " AND a.barbeiro_id = ?";
        params.push(barbeiro_id);
      }

      query += " ORDER BY a.horario ASC";

      const [agendamentos] = await db.execute(query, params);

      const [barbeiros] = await db.execute(
        `SELECT id, CONCAT(nome, ' ', sobrenome) AS nome
       FROM barbeiro
       WHERE barbearia_id = ? AND ativo = TRUE
       ORDER BY nome ASC`,
        [barbeariaId]
      );

      return res.json({ agendamentos, barbeiros });
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      return res
        .status(500)
        .json({ error: responseMessages.internalServerError });
    }
  }
);

// ─── Atualizar status de agendamento

router.patch(
  "/agendamento/:id/status",
  isAuthenticated,
  isBarbearia,
  async (req, res) => {
    const barbeariaId = req.session.user.id;
    const agendamentoId = req.params.id;
    const { status } = req.body;

    const statusValidos = ["confirmado", "cancelado", "concluido"];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ error: "Status inválido." });
    }

    try {
      const [rows] = await db.execute(
        "SELECT id FROM agendamento WHERE id = ? AND barbearia_id = ?",
        [agendamentoId, barbeariaId]
      );
      if (!rows.length)
        return res.status(404).json({ error: "Agendamento não encontrado." });

      await db.execute("UPDATE agendamento SET status = ? WHERE id = ?", [
        status,
        agendamentoId,
      ]);
      return res.json({ message: "Status atualizado." });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      return res
        .status(500)
        .json({ error: responseMessages.internalServerError });
    }
  }
);

// ─── Horários de funcionamento da barbearia

router.get("/horario", isAuthenticated, isBarbearia, async (req, res) => {
  const barbeariaId = req.session.user.id;
  try {
    const [horarios] = await db.execute(
      `SELECT id, dia_semana, hora_abertura, hora_fechamento, ativo
       FROM horario_barbearia
       WHERE barbearia_id = ?
       ORDER BY dia_semana ASC`,
      [barbeariaId]
    );
    return res.json({ horarios });
  } catch (error) {
    console.error("Erro ao buscar horários:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

// Recebe array: [{dia_semana, hora_abertura, hora_fechamento, ativo}]
router.post("/horario", isAuthenticated, isBarbearia, async (req, res) => {
  const barbeariaId = req.session.user.id;
  const { horarios } = req.body;

  if (!Array.isArray(horarios) || horarios.length === 0) {
    return res
      .status(400)
      .json({ error: "horarios deve ser um array não-vazio." });
  }

  try {
    for (const h of horarios) {
      await db.execute(
        `INSERT INTO horario_barbearia (barbearia_id, dia_semana, hora_abertura, hora_fechamento, ativo)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           hora_abertura   = VALUES(hora_abertura),
           hora_fechamento = VALUES(hora_fechamento),
           ativo           = VALUES(ativo)`,
        [
          barbeariaId,
          h.dia_semana,
          h.hora_abertura,
          h.hora_fechamento,
          h.ativo !== false,
        ]
      );
    }
    return res.json({ message: "Horários atualizados com sucesso." });
  } catch (error) {
    console.error("Erro ao salvar horários:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

// ─── Horários de trabalho de um barbeiro (gerenciado pela barbearia)

router.get(
  "/barbeiro/:id/horario",
  isAuthenticated,
  isBarbearia,
  async (req, res) => {
    const barbeariaId = req.session.user.id;
    const barbeiroId = req.params.id;
    try {
      const [check] = await db.execute(
        "SELECT id FROM barbeiro WHERE id = ? AND barbearia_id = ?",
        [barbeiroId, barbeariaId]
      );
      if (!check.length)
        return res.status(404).json({ error: "Barbeiro não encontrado." });

      const [horarios] = await db.execute(
        `SELECT id, dia_semana, hora_inicio, hora_fim, ativo
       FROM horario_barbeiro
       WHERE barbeiro_id = ?
       ORDER BY dia_semana ASC`,
        [barbeiroId]
      );
      return res.json({ horarios });
    } catch (error) {
      console.error("Erro ao buscar horários do barbeiro:", error);
      return res
        .status(500)
        .json({ error: responseMessages.internalServerError });
    }
  }
);

// Recebe array: [{dia_semana, hora_inicio, hora_fim, ativo}]
router.post(
  "/barbeiro/:id/horario",
  isAuthenticated,
  isBarbearia,
  async (req, res) => {
    const barbeariaId = req.session.user.id;
    const barbeiroId = req.params.id;
    const { horarios } = req.body;

    if (!Array.isArray(horarios) || horarios.length === 0) {
      return res
        .status(400)
        .json({ error: "horarios deve ser um array não-vazio." });
    }

    try {
      const [check] = await db.execute(
        "SELECT id FROM barbeiro WHERE id = ? AND barbearia_id = ?",
        [barbeiroId, barbeariaId]
      );
      if (!check.length)
        return res.status(404).json({ error: "Barbeiro não encontrado." });

      for (const h of horarios) {
        await db.execute(
          `INSERT INTO horario_barbeiro (barbeiro_id, dia_semana, hora_inicio, hora_fim, ativo)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           hora_inicio = VALUES(hora_inicio),
           hora_fim    = VALUES(hora_fim),
           ativo       = VALUES(ativo)`,
          [
            barbeiroId,
            h.dia_semana,
            h.hora_inicio,
            h.hora_fim,
            h.ativo !== false,
          ]
        );
      }
      return res.json({ message: "Horários do barbeiro atualizados." });
    } catch (error) {
      console.error("Erro ao salvar horários do barbeiro:", error);
      return res
        .status(500)
        .json({ error: responseMessages.internalServerError });
    }
  }
);

module.exports = router;
