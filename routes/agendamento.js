const express = require("express");
const { isAuthenticated, isBarbeiro } = require("../middleware/auth");
const pool = require("../db/db");

const router = express.Router();

router.post("/", isAuthenticated, isBarbeiro, async (req, res) => {
  const {
    // Agendamento
    cliente_id,
    horario, // "2025-05-20 14:00:00"
    observacao,

    // Opção A — serviço existente
    servico_id,

    // Opção B — serviço novo
    servico_nome,
    servico_duracao_min,
    servico_preco,
  } = req.body;

  const barbeiro_id = req.barbeiro.id;
  const barbearia_id = req.barbeiro.barbearia_id;

  // ── 1. Validação de campos obrigatórios do agendamento ───────────────
  if (!cliente_id || !horario) {
    return res
      .status(400)
      .json({ erro: "cliente_id e horario são obrigatórios." });
  }

  const horarioDate = new Date(horario);
  if (isNaN(horarioDate) || horarioDate <= new Date()) {
    return res.status(400).json({ erro: "Horário inválido ou no passado." });
  }

  // ── 2. Validação da origem do serviço (A ou B, nunca os dois) ────────
  const usandoExistente = !!servico_id;
  const usandoNovo = !!(servico_nome || servico_duracao_min || servico_preco);

  if (!usandoExistente && !usandoNovo) {
    return res.status(400).json({
      erro: "Informe servico_id (existente) ou servico_nome + servico_duracao_min + servico_preco (novo).",
    });
  }

  if (usandoExistente && usandoNovo) {
    return res.status(400).json({
      erro: "Informe apenas servico_id OU os dados do novo serviço, não os dois.",
    });
  }

  if (usandoNovo) {
    if (!servico_nome || !servico_duracao_min || servico_preco === undefined) {
      return res.status(400).json({
        erro: "Para criar um serviço, informe servico_nome, servico_duracao_min e servico_preco.",
      });
    }
    if (
      !Number.isInteger(Number(servico_duracao_min)) ||
      Number(servico_duracao_min) <= 0
    ) {
      return res
        .status(400)
        .json({ erro: "servico_duracao_min deve ser um inteiro positivo." });
    }
    if (isNaN(Number(servico_preco)) || Number(servico_preco) < 0) {
      return res.status(400).json({ erro: "servico_preco inválido." });
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ── 3. Cliente existe e está vinculado à barbearia ───────────────
    const [[clienteVinculo]] = await conn.query(
      `SELECT cb.id
         FROM cliente_barbearias cb
         JOIN cliente c ON c.id = cb.cliente_id
        WHERE cb.cliente_id   = ?
          AND cb.barbearia_id = ?
          AND c.ativo = TRUE`,
      [cliente_id, barbearia_id]
    );
    if (!clienteVinculo) {
      await conn.rollback();
      return res
        .status(404)
        .json({ erro: "Cliente não encontrado nesta barbearia." });
    }

    // ── 4. Barbeiro ativo e pertence à barbearia ─────────────────────
    const [[barbeiro]] = await conn.query(
      `SELECT id FROM barbeiro
        WHERE id = ? AND barbearia_id = ? AND ativo = TRUE`,
      [barbeiro_id, barbearia_id]
    );
    if (!barbeiro) {
      await conn.rollback();
      return res
        .status(403)
        .json({ erro: "Barbeiro inativo ou sem vínculo com a barbearia." });
    }

    // ── 5. Resolve o serviço ─────────────────────────────────────────
    let resolvedServico;

    if (usandoExistente) {
      // 5A. Busca serviço existente — deve pertencer à barbearia e estar ativo
      const [[servicoExistente]] = await conn.query(
        `SELECT id, duracao_min FROM servico
          WHERE id = ? AND barbearia_id = ? AND ativo = TRUE`,
        [servico_id, barbearia_id]
      );
      if (!servicoExistente) {
        await conn.rollback();
        return res
          .status(404)
          .json({ erro: "Serviço não encontrado ou inativo." });
      }
      resolvedServico = servicoExistente;
    } else {
      // 5B. Cria o serviço novo dentro da mesma transação
      const [insertServico] = await conn.query(
        `INSERT INTO servico (barbearia_id, nome, duracao_min, preco, ativo)
         VALUES (?, ?, ?, ?, TRUE)`,
        [
          barbearia_id,
          servico_nome.trim(),
          Number(servico_duracao_min),
          Number(servico_preco),
        ]
      );
      resolvedServico = {
        id: insertServico.insertId,
        duracao_min: Number(servico_duracao_min),
      };
    }

    const { id: finalServicoid, duracao_min: duracao } = resolvedServico;

    // ── 6. Horário dentro do expediente do barbeiro ──────────────────
    const diaSemana = horarioDate.getDay();
    const horaInicio = horarioDate.toTimeString().slice(0, 8);
    const horaFim = calcularHoraFim(horarioDate, duracao);

    const [[expediente]] = await conn.query(
      `SELECT id FROM horario_barbeiro
        WHERE barbeiro_id  = ?
          AND dia_semana   = ?
          AND hora_inicio <= ?
          AND hora_fim    >= ?
          AND ativo = TRUE`,
      [barbeiro_id, diaSemana, horaInicio, horaFim]
    );
    if (!expediente) {
      await conn.rollback();
      return res
        .status(409)
        .json({ erro: "Horário fora do expediente do barbeiro." });
    }

    // ── 7. Conflito na agenda do barbeiro ────────────────────────────
    const horarioFimDatetime = new Date(
      horarioDate.getTime() + duracao * 60000
    );

    const [[conflitoBarbeiro]] = await conn.query(
      `SELECT a.id
         FROM agendamento a
         JOIN servico s ON s.id = a.servico_id
        WHERE a.barbeiro_id = ?
          AND a.status      = 'confirmado'
          AND a.horario     < ?
          AND DATE_ADD(a.horario, INTERVAL s.duracao_min MINUTE) > ?`,
      [barbeiro_id, horarioFimDatetime, horarioDate]
    );
    if (conflitoBarbeiro) {
      await conn.rollback();
      return res
        .status(409)
        .json({ erro: "Barbeiro já possui agendamento neste horário." });
    }

    // ── 8. Conflito na agenda do cliente ─────────────────────────────
    const [[conflitoCliente]] = await conn.query(
      `SELECT a.id
         FROM agendamento a
         JOIN servico s ON s.id = a.servico_id
        WHERE a.cliente_id = ?
          AND a.status     = 'confirmado'
          AND a.horario    < ?
          AND DATE_ADD(a.horario, INTERVAL s.duracao_min MINUTE) > ?`,
      [cliente_id, horarioFimDatetime, horarioDate]
    );
    if (conflitoCliente) {
      await conn.rollback();
      return res
        .status(409)
        .json({ erro: "Cliente já possui agendamento neste horário." });
    }

    // ── 9. Persiste o agendamento ────────────────────────────────────
    const [result] = await conn.query(
      `INSERT INTO agendamento
         (barbearia_id, cliente_id, barbeiro_id, servico_id, horario, status, observacao)
       VALUES (?, ?, ?, ?, ?, 'confirmado', ?)`,
      [
        barbearia_id,
        cliente_id,
        barbeiro_id,
        finalServicoid,
        horario,
        observacao ?? null,
      ]
    );

    await conn.commit();

    return res.status(201).json({
      mensagem: "Agendamento criado com sucesso.",
      agendamento_id: result.insertId,
      servico_id: finalServicoid,
      servico_criado: usandoNovo, // informa ao front se foi criado ou reutilizado
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ erro: "Erro interno ao criar agendamento." });
  } finally {
    conn.release();
  }
});

function calcularHoraFim(date, minutos) {
  const fim = new Date(date.getTime() + minutos * 60000);
  return fim.toTimeString().slice(0, 8);
}

module.exports = router;
