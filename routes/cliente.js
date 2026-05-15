const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("../db/db");
const { isAuthenticated, isCliente } = require("../middleware/auth");
const { recordExists } = require("../utils/dbChecks");
const responseMessages = require("../utils/responseMessages");
const { validateClientePayload } = require("../validators/cliente");
const { generateSlots } = require("../utils/slots");

const router = express.Router();

// ─── Cadastro

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
      "INSERT INTO cliente (nome, sobrenome, email, telefone, senha) VALUES (?,?,?,?,?);",
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
      user: { id: result.insertId, nome: cliente.nome, email: cliente.email },
    });
  } catch (error) {
    console.error("Erro no cadastro de cliente:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

// ─── Vincular cliente a barbearias

router.post(
  "/cliente-barbearia",
  isAuthenticated,
  isCliente,
  async (req, res) => {
    const cliente = req.body.cliente_id;
    const barbearias = req.body.barbearias;

    try {
      if (!Array.isArray(barbearias) || barbearias.length === 0) {
        return res
          .status(400)
          .json({ erros: responseMessages.invalidBarbearias });
      }

      for (const barbearia of barbearias) {
        await db.execute(
          `INSERT INTO cliente_barbearias (barbearia_id, cliente_id) VALUES (?, ?)`,
          [barbearia, cliente]
        );
      }
      return res.status(201).json({ message: responseMessages.linkedCliente });
    } catch (error) {
      console.error("Erro ao linkar cliente à uma barbearia:", error);
      return res
        .status(500)
        .json({ error: responseMessages.internalServerError });
    }
  }
);

// ─── Dashboard

router.get("/dashboard", isAuthenticated, isCliente, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/dashboard_cliente/index.html"));
});

// ─── Página de agenda / booking

router.get("/agenda", isAuthenticated, isCliente, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/agenda_cliente/index.html"));
});

// ─── Horários da barbearia vinculada ao cliente

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

// ─── Listar todas as barbearias

router.get("/barbearias", isAuthenticated, isCliente, async (req, res) => {
  try {
    const [barbearias] = await db.execute(
      `SELECT id, nome_fantasia, email, telefone
       FROM barbearia
       WHERE ativo = TRUE
       ORDER BY nome_fantasia ASC`
    );
    return res.json({ barbearias });
  } catch (error) {
    console.error("Erro ao listar barbearias:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

// ─── Detalhes de uma barbearia + próximos agendamentos

router.get("/barbearia/:id", isAuthenticated, isCliente, async (req, res) => {
  const barbeariaId = req.params.id;
  try {
    const [rows] = await db.execute(
      "SELECT id, nome_fantasia, email, telefone FROM barbearia WHERE id = ? AND ativo = TRUE",
      [barbeariaId]
    );
    if (!rows.length)
      return res.status(404).json({ error: "Barbearia não encontrada." });

    const [horarios] = await db.execute(
      `SELECT dia_semana, abertura, fechamento
       FROM horario_funcionamento
       WHERE barbearia_id = ? AND ativo = TRUE
       ORDER BY dia_semana ASC`,
      [barbeariaId]
    );

    const [agendamentos] = await db.execute(
      `SELECT
         a.horario,
         CONCAT(bar.nome, ' ', bar.sobrenome) AS barbeiro_nome,
         s.nome AS servico_nome,
         s.duracao_min
       FROM agendamento a
       JOIN barbeiro bar ON bar.id = a.barbeiro_id
       JOIN servico  s   ON s.id   = a.servico_id
       WHERE a.barbearia_id = ?
         AND a.horario >= NOW()
         AND a.status = 'confirmado'
       ORDER BY a.horario ASC
       LIMIT 15`,
      [barbeariaId]
    );

    return res.json({ barbearia: rows[0], horarios, agendamentos });
  } catch (error) {
    console.error("Erro ao buscar barbearia:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

// ─── Barbeiros de uma barbearia

router.get(
  "/barbearia/:id/barbeiros",
  isAuthenticated,
  isCliente,
  async (req, res) => {
    const barbeariaId = req.params.id;
    try {
      const [barbeiros] = await db.execute(
        `SELECT id, CONCAT(nome, ' ', sobrenome) AS nome
       FROM barbeiro
       WHERE barbearia_id = ? AND ativo = TRUE
       ORDER BY nome ASC`,
        [barbeariaId]
      );
      return res.json({ barbeiros });
    } catch (error) {
      console.error("Erro ao buscar barbeiros:", error);
      return res
        .status(500)
        .json({ error: responseMessages.internalServerError });
    }
  }
);

// ─── Serviços de uma barbearia

router.get(
  "/barbearia/:id/servicos",
  isAuthenticated,
  isCliente,
  async (req, res) => {
    const barbeariaId = req.params.id;
    try {
      const [servicos] = await db.execute(
        `SELECT id, nome, duracao_min, preco
       FROM servico
       WHERE barbearia_id = ? AND ativo = TRUE
       ORDER BY nome ASC`,
        [barbeariaId]
      );
      return res.json({ servicos });
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
      return res
        .status(500)
        .json({ error: responseMessages.internalServerError });
    }
  }
);

// ─── Slots disponíveis de um barbeiro
// GET /cliente/barbeiro/:id/slots?data=YYYY-MM-DD&servico_id=X

router.get(
  "/barbeiro/:id/slots",
  isAuthenticated,
  isCliente,
  async (req, res) => {
    const barbeiroId = req.params.id;
    const { data, servico_id } = req.query;

    if (!data || !servico_id) {
      return res
        .status(400)
        .json({ error: "Parâmetros obrigatórios: data e servico_id." });
    }

    try {
      const [servicos] = await db.execute(
        "SELECT duracao_min FROM servico WHERE id = ? AND ativo = TRUE",
        [servico_id]
      );
      if (!servicos.length)
        return res.status(404).json({ error: "Serviço não encontrado." });
      const duracaoMin = servicos[0].duracao_min;

      const [barbeiros] = await db.execute(
        "SELECT id, barbearia_id FROM barbeiro WHERE id = ? AND ativo = TRUE",
        [barbeiroId]
      );
      if (!barbeiros.length)
        return res.status(404).json({ error: "Barbeiro não encontrado." });
      const barbeariaId = barbeiros[0].barbearia_id;

      const dataObj = new Date(data + "T12:00:00");
      const diaSemana = dataObj.getDay();

      const [horBarbearia] = await db.execute(
        `SELECT abertura, fechamento
       FROM horario_funcionamento
       WHERE barbearia_id = ? AND dia_semana = ? AND ativo = TRUE`,
        [barbeariaId, diaSemana]
      );
      if (!horBarbearia.length) return res.json({ slots: [] });

      const [horBarbeiro] = await db.execute(
        `SELECT hora_inicio, hora_fim
       FROM horario_barbeiro
       WHERE barbeiro_id = ? AND dia_semana = ? AND ativo = TRUE`,
        [barbeiroId, diaSemana]
      );
      if (!horBarbeiro.length) return res.json({ slots: [] });

      const { timeToMinutes, minutesToTime } = require("../utils/slots");
      const inicioMin = Math.max(
        timeToMinutes(horBarbearia[0].hora_abertura),
        timeToMinutes(horBarbeiro[0].hora_inicio)
      );
      const fimMin = Math.min(
        timeToMinutes(horBarbearia[0].hora_fechamento),
        timeToMinutes(horBarbeiro[0].hora_fim)
      );

      const [agendamentosExistentes] = await db.execute(
        `SELECT a.horario, s.duracao_min
       FROM agendamento a
       JOIN servico s ON s.id = a.servico_id
       WHERE a.barbeiro_id = ? AND DATE(a.horario) = ? AND a.status != 'cancelado'`,
        [barbeiroId, data]
      );

      const slots = generateSlots(
        data,
        minutesToTime(inicioMin),
        minutesToTime(fimMin),
        duracaoMin,
        agendamentosExistentes
      );

      return res.json({ slots });
    } catch (error) {
      console.error("Erro ao gerar slots:", error);
      return res
        .status(500)
        .json({ error: responseMessages.internalServerError });
    }
  }
);

// ─── Criar agendamento

router.post("/agendamento", isAuthenticated, isCliente, async (req, res) => {
  const clienteId = req.session.user.id;
  const { barbearia_id, barbeiro_id, servico_id, horario } = req.body;

  if (!barbearia_id || !barbeiro_id || !servico_id || !horario) {
    return res.status(400).json({
      error:
        "Campos obrigatórios: barbearia_id, barbeiro_id, servico_id, horario.",
    });
  }

  try {
    const [servicos] = await db.execute(
      "SELECT duracao_min FROM servico WHERE id = ? AND ativo = TRUE",
      [servico_id]
    );
    if (!servicos.length)
      return res.status(404).json({ error: "Serviço não encontrado." });
    const duracaoMin = servicos[0].duracao_min;

    const horarioDate = new Date(horario);
    const horarioStr = horarioDate.toISOString().slice(0, 19).replace("T", " ");
    const horarioFimStr = new Date(horarioDate.getTime() + duracaoMin * 60000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const [conflito] = await db.execute(
      `SELECT a.id FROM agendamento a
       JOIN servico s ON s.id = a.servico_id
       WHERE a.barbeiro_id = ?
         AND a.status != 'cancelado'
         AND a.horario < ?
         AND DATE_ADD(a.horario, INTERVAL s.duracao_min MINUTE) > ?`,
      [barbeiro_id, horarioFimStr, horarioStr]
    );

    if (conflito.length) {
      return res
        .status(409)
        .json({ error: "Horário não disponível. Escolha outro slot." });
    }

    const [result] = await db.execute(
      `INSERT INTO agendamento (barbearia_id, cliente_id, barbeiro_id, servico_id, horario)
       VALUES (?, ?, ?, ?, ?)`,
      [barbearia_id, clienteId, barbeiro_id, servico_id, horarioStr]
    );

    return res.status(201).json({
      message: "Agendamento realizado com sucesso!",
      agendamento_id: result.insertId,
    });
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

// ─── Agendamentos do cliente

router.get("/agendamentos", isAuthenticated, isCliente, async (req, res) => {
  const clienteId = req.session.user.id;
  try {
    const [agendamentos] = await db.execute(
      `SELECT
         a.id, a.horario, a.status, a.observacao,
         b.nome_fantasia AS barbearia_nome,
         CONCAT(bar.nome, ' ', bar.sobrenome) AS barbeiro_nome,
         s.nome AS servico_nome, s.duracao_min, s.preco
       FROM agendamento a
       JOIN barbearia b  ON b.id   = a.barbearia_id
       JOIN barbeiro bar ON bar.id = a.barbeiro_id
       JOIN servico  s   ON s.id   = a.servico_id
       WHERE a.cliente_id = ?
       ORDER BY a.horario DESC`,
      [clienteId]
    );
    return res.json({ agendamentos });
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

// ─── Cancelar agendamento

router.delete(
  "/agendamento/:id",
  isAuthenticated,
  isCliente,
  async (req, res) => {
    const clienteId = req.session.user.id;
    const agendamentoId = req.params.id;
    try {
      const [rows] = await db.execute(
        "SELECT id, status FROM agendamento WHERE id = ? AND cliente_id = ?",
        [agendamentoId, clienteId]
      );
      if (!rows.length)
        return res.status(404).json({ error: "Agendamento não encontrado." });
      if (rows[0].status === "cancelado") {
        return res
          .status(400)
          .json({ error: "Agendamento já está cancelado." });
      }

      await db.execute(
        "UPDATE agendamento SET status = 'cancelado' WHERE id = ?",
        [agendamentoId]
      );
      return res.json({ message: "Agendamento cancelado com sucesso." });
    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error);
      return res
        .status(500)
        .json({ error: responseMessages.internalServerError });
    }
  }
);

module.exports = router;
