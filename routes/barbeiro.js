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
    const cpfJaCadastrado = await recordExists(db, "barbeiro", "cpf", barbeiro.cpf);
    if (cpfJaCadastrado) {
      return res.status(409).json({ error: responseMessages.duplicateBarbeiroCpf });
    }

    const emailJaCadastrado = await recordExists(db, "barbeiro", "email", barbeiro.email);
    if (emailJaCadastrado) {
      return res.status(409).json({ error: responseMessages.duplicateBarbeiroEmail });
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
    return res.status(500).json({ error: responseMessages.internalServerError });
  }
});

// ─── Agenda do barbeiro (feature/agenda)
router.get("/agenda", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/agenda_barbeiro/index.html"));
});

// ─── Listar barbeiros da barbearia
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
    return res.status(500).json({ error: responseMessages.internalServerError });
  }
});

router.get("/dashboard", isAuthenticated, isBarbeiro, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/dashboard_barbeiro/index.html"));
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
    console.error("Erro ao buscar horários:", error);
    return res.status(500).json({ error: responseMessages.internalServerError });
  }
});

// ─── Agendamentos do barbeiro (por data)
router.get("/agenda/agendamentos", isAuthenticated, isBarbeiro, async (req, res) => {
  const barbeiroId = req.session.user.id;
  const data = req.query.data || new Date().toISOString().split("T")[0];

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
         AND DATE(a.horario) = ?
       ORDER BY a.horario ASC`,
      [barbeiroId, data]
    );

    return res.json({ agendamentos });
  } catch (error) {
    console.error("Erro ao buscar agenda do barbeiro:", error);
    return res.status(500).json({ error: responseMessages.internalServerError });
  }
});

module.exports = router;