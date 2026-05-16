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
      console.error("Erro ao linkar cliente a uma barbearia:", error);
      return res
        .status(500)
        .json({ error: responseMessages.internalServerError });
    }
  }
);

router.get("/dashboard", isAuthenticated, isCliente, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/dashboard_cliente/index.html"));
});

router.get("/agenda", isAuthenticated, isCliente, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/agenda_cliente/index.html"));
});

router.get("/horarios", isAuthenticated, isCliente, async (req, res) => {
  try {
    const [horarios] = await db.execute(
      `SELECT hf.dia_semana, hf.abertura, hf.fechamento, hf.fechado
       FROM horario_funcionamento hf
       JOIN cliente_barbearias cb ON cb.barbearia_id = hf.barbearia_id
       WHERE cb.cliente_id = ?
       ORDER BY hf.dia_semana`,
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

router.get("/barbearias", isAuthenticated, isCliente, async (req, res) => {
  try {
    const [barbearias] = await db.execute(
      `SELECT b.id, b.nome_fantasia, b.email, b.telefone
       FROM barbearia b
       JOIN cliente_barbearias cb ON cb.barbearia_id = b.id
       WHERE cb.cliente_id = ?
         AND b.ativo = TRUE
       ORDER BY b.nome_fantasia ASC`,
      [req.session.user.id]
    );
    return res.json({ barbearias });
  } catch (error) {
    console.error("Erro ao listar barbearias:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

router.get("/barbearia/:id", isAuthenticated, isCliente, async (req, res) => {
  const barbeariaId = req.params.id;
  const clienteId = req.session.user.id;

  try {
    const [rows] = await db.execute(
      `SELECT b.id, b.nome_fantasia, b.email, b.telefone
       FROM barbearia b
       JOIN cliente_barbearias cb ON cb.barbearia_id = b.id
       WHERE b.id = ?
         AND cb.cliente_id = ?
         AND b.ativo = TRUE`,
      [barbeariaId, clienteId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Barbearia nao encontrada." });
    }

    let [horarios] = await db.execute(
      `SELECT dia_semana, abertura AS hora_abertura, fechamento AS hora_fechamento
       FROM horario_funcionamento
       WHERE barbearia_id = ? AND fechado = FALSE
       ORDER BY dia_semana ASC`,
      [barbeariaId]
    );

    if (!horarios.length) {
      [horarios] = await db.execute(
        `SELECT dia_semana, hora_abertura, hora_fechamento
         FROM horario_barbearia
         WHERE barbearia_id = ? AND ativo = TRUE
         ORDER BY dia_semana ASC`,
        [barbeariaId]
      );
    }

    const [agendamentos] = await db.execute(
      `SELECT
         a.horario,
         CONCAT(bar.nome, ' ', bar.sobrenome) AS barbeiro_nome,
         s.nome AS servico_nome,
         s.duracao_min
       FROM agendamento a
       JOIN barbeiro bar ON bar.id = a.barbeiro_id
       JOIN servico s ON s.id = a.servico_id
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

router.get(
  "/barbearia/:id/barbeiros",
  isAuthenticated,
  isCliente,
  async (req, res) => {
    const barbeariaId = req.params.id;
    const clienteId = req.session.user.id;

    try {
      const [barbeiros] = await db.execute(
        `SELECT b.id, CONCAT(b.nome, ' ', b.sobrenome) AS nome
         FROM barbeiro b
         JOIN cliente_barbearias cb ON cb.barbearia_id = b.barbearia_id
         WHERE b.barbearia_id = ?
           AND cb.cliente_id = ?
           AND b.ativo = TRUE
         ORDER BY nome ASC`,
        [barbeariaId, clienteId]
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

router.get(
  "/barbearia/:id/servicos",
  isAuthenticated,
  isCliente,
  async (req, res) => {
    const barbeariaId = req.params.id;
    const clienteId = req.session.user.id;

    try {
      const [servicos] = await db.execute(
        `SELECT s.id, s.nome, s.duracao_min, s.preco
         FROM servico s
         JOIN cliente_barbearias cb ON cb.barbearia_id = s.barbearia_id
         WHERE s.barbearia_id = ?
           AND cb.cliente_id = ?
           AND s.ativo = TRUE
         ORDER BY s.nome ASC`,
        [barbeariaId, clienteId]
      );
      return res.json({ servicos });
    } catch (error) {
      console.error("Erro ao buscar servicos:", error);
      return res
        .status(500)
        .json({ error: responseMessages.internalServerError });
    }
  }
);

router.get(
  "/barbeiro/:id/slots",
  isAuthenticated,
  isCliente,
  async (req, res) => {
    const barbeiroId = req.params.id;
    const clienteId = req.session.user.id;
    const { data, servico_id } = req.query;

    if (!data || !servico_id) {
      return res
        .status(400)
        .json({ error: "Parametros obrigatorios: data e servico_id." });
    }

    try {
      const [servicos] = await db.execute(
        `SELECT s.duracao_min
         FROM servico s
         JOIN barbeiro b ON b.barbearia_id = s.barbearia_id
         JOIN cliente_barbearias cb ON cb.barbearia_id = s.barbearia_id
         WHERE s.id = ?
           AND b.id = ?
           AND cb.cliente_id = ?
           AND s.ativo = TRUE
           AND b.ativo = TRUE`,
        [servico_id, barbeiroId, clienteId]
      );
      if (!servicos.length) {
        return res.status(404).json({ error: "Servico nao encontrado." });
      }
      const duracaoMin = servicos[0].duracao_min;

      const [barbeiros] = await db.execute(
        `SELECT b.id, b.barbearia_id
         FROM barbeiro b
         JOIN cliente_barbearias cb ON cb.barbearia_id = b.barbearia_id
         WHERE b.id = ? AND cb.cliente_id = ? AND b.ativo = TRUE`,
        [barbeiroId, clienteId]
      );
      if (!barbeiros.length) {
        return res.status(404).json({ error: "Barbeiro nao encontrado." });
      }
      const barbeariaId = barbeiros[0].barbearia_id;

      const dataObj = new Date(`${data}T12:00:00`);
      const diaSemana = dataObj.getDay();

      let [horBarbearia] = await db.execute(
        `SELECT MIN(abertura) AS hora_abertura, MAX(fechamento) AS hora_fechamento,
                MAX(CASE WHEN fechado THEN 1 ELSE 0 END) AS fechado
         FROM horario_funcionamento
         WHERE barbearia_id = ? AND dia_semana = ?`,
        [barbeariaId, diaSemana]
      );

      if (
        horBarbearia.length &&
        horBarbearia[0].fechado &&
        horBarbearia[0].hora_abertura &&
        horBarbearia[0].hora_fechamento
      ) {
        return res.json({ slots: [] });
      }

      if (
        !horBarbearia[0]?.hora_abertura ||
        !horBarbearia[0]?.hora_fechamento
      ) {
        [horBarbearia] = await db.execute(
          `SELECT MIN(hora_abertura) AS hora_abertura, MAX(hora_fechamento) AS hora_fechamento
           FROM horario_barbearia
           WHERE barbearia_id = ? AND dia_semana = ? AND ativo = TRUE`,
          [barbeariaId, diaSemana]
        );
      }

      const [horBarbeiro] = await db.execute(
        `SELECT MIN(hora_inicio) AS hora_inicio, MAX(hora_fim) AS hora_fim
         FROM horario_barbeiro
         WHERE barbeiro_id = ? AND dia_semana = ? AND ativo = TRUE`,
        [barbeiroId, diaSemana]
      );

      const horaInicioBarbearia = horBarbearia[0]?.hora_abertura || null;
      const horaFimBarbearia = horBarbearia[0]?.hora_fechamento || null;
      const horaInicioBarbeiro = horBarbeiro[0]?.hora_inicio || null;
      const horaFimBarbeiro = horBarbeiro[0]?.hora_fim || null;

      if (!horaInicioBarbearia && !horaInicioBarbeiro) {
        return res.json({ slots: [] });
      }

      const inicioReferencia = horaInicioBarbearia || horaInicioBarbeiro;
      const fimReferencia = horaFimBarbearia || horaFimBarbeiro;
      const inicioComparacao = horaInicioBarbeiro || horaInicioBarbearia;
      const fimComparacao = horaFimBarbeiro || horaFimBarbearia;

      const { timeToMinutes, minutesToTime } = require("../utils/slots");
      const inicioMin = Math.max(
        timeToMinutes(inicioReferencia),
        timeToMinutes(inicioComparacao)
      );
      const fimMin = Math.min(
        timeToMinutes(fimReferencia),
        timeToMinutes(fimComparacao)
      );

      if (inicioMin >= fimMin) {
        return res.json({ slots: [] });
      }

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

router.post("/agendamento", isAuthenticated, isCliente, async (req, res) => {
  const clienteId = req.session.user.id;
  const { barbearia_id, barbeiro_id, servico_id, horario } = req.body;

  if (!barbearia_id || !barbeiro_id || !servico_id || !horario) {
    return res.status(400).json({
      error:
        "Campos obrigatorios: barbearia_id, barbeiro_id, servico_id, horario.",
    });
  }

  try {
    const [vinculo] = await db.execute(
      `SELECT id
       FROM cliente_barbearias
       WHERE cliente_id = ? AND barbearia_id = ?`,
      [clienteId, barbearia_id]
    );

    if (!vinculo.length) {
      return res.status(403).json({
        error: "Cliente nao vinculado a esta barbearia.",
      });
    }

    const [servicos] = await db.execute(
      `SELECT duracao_min
       FROM servico
       WHERE id = ? AND barbearia_id = ? AND ativo = TRUE`,
      [servico_id, barbearia_id]
    );
    if (!servicos.length) {
      return res.status(404).json({ error: "Servico nao encontrado." });
    }
    const duracaoMin = servicos[0].duracao_min;

    const [barbeiro] = await db.execute(
      `SELECT id
       FROM barbeiro
       WHERE id = ? AND barbearia_id = ? AND ativo = TRUE`,
      [barbeiro_id, barbearia_id]
    );
    if (!barbeiro.length) {
      return res.status(404).json({ error: "Barbeiro nao encontrado." });
    }

    const horarioDate = parseLocalDateTime(horario);
    if (!horarioDate) {
      return res.status(400).json({ error: "Horario invalido." });
    }

    const horarioStr = formatDateTimeForSql(horarioDate);
    const horarioFimStr = formatDateTimeForSql(
      new Date(horarioDate.getTime() + duracaoMin * 60000)
    );

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
        .json({ error: "Horario nao disponivel. Escolha outro slot." });
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
      if (!rows.length) {
        return res.status(404).json({ error: "Agendamento nao encontrado." });
      }
      if (rows[0].status === "cancelado") {
        return res
          .status(400)
          .json({ error: "Agendamento ja esta cancelado." });
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

function parseLocalDateTime(value) {
  if (!value) return null;

  const [datePart, timePart] = String(value)
    .trim()
    .replace(" ", "T")
    .split("T");
  if (!datePart || !timePart) return null;

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second = 0] = timePart.split(":").map(Number);

  if (
    [year, month, day, hour, minute, second].some((part) => Number.isNaN(part))
  ) {
    return null;
  }

  return new Date(year, month - 1, day, hour, minute, second);
}

function formatDateTimeForSql(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
