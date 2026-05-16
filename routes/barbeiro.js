const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("../db/db");
const {
  isAuthenticated,
  isBarbearia,
  isBarbeiro,
} = require("../middleware/auth");
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
      `INSERT INTO barbeiro
        (barbearia_id, nome, sobrenome, cpf, email, telefone, senha)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
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

router.get("/agenda", isAuthenticated, isBarbeiro, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/agenda_barbeiro/index.html"));
});

router.get("/servicos/novo", isAuthenticated, isBarbeiro, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/servicos_barbeiro/index.html"));
});

router.get("/lista", isAuthenticated, isBarbearia, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, nome, sobrenome, email, telefone
       FROM barbeiro
       WHERE barbearia_id = ? AND ativo = TRUE
       ORDER BY nome ASC`,
      [req.session.user.id]
    );

    const barbeiros = rows.map((b) => ({
      id: b.id,
      nome_completo: `${b.nome} ${b.sobrenome}`,
      iniciais: (b.nome[0] + b.sobrenome[0]).toUpperCase(),
      email: b.email,
      telefone: b.telefone,
    }));

    return res.json({ barbeiros });
  } catch (error) {
    console.error("Erro ao listar barbeiros:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

router.get("/dashboard", isAuthenticated, isBarbeiro, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/dashboard_barbeiro/index.html"));
});

router.get("/clientes", isAuthenticated, isBarbeiro, async (req, res) => {
  try {
    const [clientes] = await db.execute(
      `SELECT c.id, c.nome, c.sobrenome, c.telefone
         FROM cliente c
         JOIN cliente_barbearias cb ON cb.cliente_id = c.id
        WHERE cb.barbearia_id = (
          SELECT barbearia_id FROM barbeiro WHERE id = ?
        )
          AND c.ativo = TRUE
        ORDER BY c.nome ASC, c.sobrenome ASC`,
      [req.session.user.id]
    );

    return res.json({ clientes });
  } catch (error) {
    console.error("Erro ao buscar clientes do barbeiro:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

router.get("/servicos", isAuthenticated, isBarbeiro, async (req, res) => {
  try {
    const [servicos] = await db.execute(
      `SELECT id, nome, duracao_min, preco
         FROM servico
        WHERE barbearia_id = (
          SELECT barbearia_id FROM barbeiro WHERE id = ?
        )
          AND ativo = TRUE
        ORDER BY nome ASC`,
      [req.session.user.id]
    );

    return res.json({ servicos });
  } catch (error) {
    console.error("Erro ao buscar servicos do barbeiro:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

router.post("/servicos", isAuthenticated, isBarbeiro, async (req, res) => {
  const nome = String(req.body.nome || "").trim();
  const duracaoMin = Number(req.body.duracao_min);
  const preco = Number(req.body.preco);

  if (!nome || !Number.isInteger(duracaoMin) || duracaoMin <= 0) {
    return res.status(400).json({
      error: "Informe um nome e uma duracao valida para o servico.",
    });
  }

  if (Number.isNaN(preco) || preco < 0) {
    return res.status(400).json({
      error: "Informe um preco valido para o servico.",
    });
  }

  try {
    const [[barbeiro]] = await db.execute(
      `SELECT barbearia_id
         FROM barbeiro
        WHERE id = ? AND ativo = TRUE`,
      [req.session.user.id]
    );

    if (!barbeiro) {
      return res.status(404).json({ error: "Barbeiro nao encontrado." });
    }

    const [[servicoExistente]] = await db.execute(
      `SELECT id
         FROM servico
        WHERE barbearia_id = ?
          AND ativo = TRUE
          AND TRIM(LOWER(nome)) = TRIM(LOWER(?))
        LIMIT 1`,
      [barbeiro.barbearia_id, nome]
    );

    if (servicoExistente) {
      return res.status(409).json({
        error: "Ja existe um servico ativo com este nome.",
      });
    }

    const [result] = await db.execute(
      `INSERT INTO servico (barbearia_id, nome, duracao_min, preco, ativo)
       VALUES (?, ?, ?, ?, TRUE)`,
      [barbeiro.barbearia_id, nome, duracaoMin, preco]
    );

    return res.status(201).json({
      message: "Servico cadastrado com sucesso.",
      servico: {
        id: result.insertId,
        nome,
        duracao_min: duracaoMin,
        preco,
      },
    });
  } catch (error) {
    console.error("Erro ao cadastrar servico:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

router.get("/horarios", isAuthenticated, isBarbeiro, async (req, res) => {
  try {
    const [horarios] = await db.execute(
      `SELECT dia_semana, abertura, fechamento, fechado
       FROM horario_funcionamento
       WHERE barbearia_id = (
         SELECT barbearia_id FROM barbeiro WHERE id = ?
       )
       ORDER BY dia_semana`,
      [req.session.user.id]
    );
    return res.json({ horarios });
  } catch (error) {
    console.error("Erro ao buscar horarios:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

// ─── Agendamentos do barbeiro (por data ou intervalo)
router.get(
  "/agenda/agendamentos",
  isAuthenticated,
  isBarbeiro,
  async (req, res) => {
    const barbeiroId = req.session.user.id;
    const { data, data_inicio, data_fim } = req.query;

    // Suporta data única ou intervalo
    const inicio = data_inicio || data || new Date().toISOString().split("T")[0];
    const fim = data_fim || data_inicio || inicio;

    try {
      const [agendamentos] = await db.execute(
        `SELECT
           a.id, a.horario, a.status, a.observacao,
           CONCAT(c.nome, ' ', c.sobrenome) AS cliente_nome,
           c.telefone                        AS cliente_telefone,
           s.nome                            AS servico_nome,
           s.duracao_min,
           s.preco
         FROM agendamento a
         JOIN cliente c ON c.id = a.cliente_id
         JOIN servico s ON s.id = a.servico_id
         WHERE a.barbeiro_id = ?
           AND DATE(a.horario) BETWEEN ? AND ?
         ORDER BY a.horario ASC`,
        [barbeiroId, inicio, fim]
      );

      return res.json({ agendamentos });
    } catch (error) {
      console.error("Erro ao buscar agenda do barbeiro:", error);
      return res
        .status(500)
        .json({ error: responseMessages.internalServerError });
    }
  }
);

// ─── Atualizar status do agendamento
router.patch(
  "/agendamento/:id/status",
  isAuthenticated,
  isBarbeiro,
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const statusValidos = ["confirmado", "concluido", "cancelado"];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ error: "Status inválido." });
    }

    try {
      const [result] = await db.execute(
        `UPDATE agendamento
         SET status = ?
         WHERE id = ? AND barbeiro_id = ?`,
        [status, id, req.session.user.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Agendamento não encontrado." });
      }

      return res.json({ success: true });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      return res
        .status(500)
        .json({ error: responseMessages.internalServerError });
    }
  }
);

module.exports = router;
