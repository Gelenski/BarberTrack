const express = require("express");
const { isAuthenticated, isBarbeiro } = require("../middleware/auth");
const pool = require("../db/db");

const router = express.Router();

router.post("/", isAuthenticated, isBarbeiro, async (req, res) => {
  const {
    cliente_id,
    horario,
    observacao,
    servico_id,
    servico_nome,
    servico_duracao_min,
    servico_preco,
  } = req.body;

  const barbeiroId = req.session.user.id;
  const nomeServicoNormalizado = String(servico_nome || "").trim();
  const duracaoServico = Number(servico_duracao_min);
  const precoServico = Number(servico_preco);

  if (!cliente_id || !horario) {
    return res.status(400).json({
      erro: "cliente_id e horario sao obrigatorios.",
    });
  }

  const horarioDate = new Date(horario);
  if (Number.isNaN(horarioDate.getTime()) || horarioDate <= new Date()) {
    return res.status(400).json({
      erro: "Horario invalido ou no passado.",
    });
  }

  const usandoExistente = !!servico_id;
  const usandoNovo = !!(
    nomeServicoNormalizado ||
    servico_duracao_min !== undefined ||
    servico_preco !== undefined
  );

  if (!usandoExistente && !usandoNovo) {
    return res.status(400).json({
      erro: "Informe servico_id (existente) ou servico_nome + servico_duracao_min + servico_preco (novo).",
    });
  }

  if (usandoExistente && usandoNovo) {
    return res.status(400).json({
      erro: "Informe apenas servico_id OU os dados do novo servico, nao os dois.",
    });
  }

  if (usandoNovo) {
    if (
      !nomeServicoNormalizado ||
      servico_duracao_min === undefined ||
      servico_preco === undefined
    ) {
      return res.status(400).json({
        erro: "Para criar um servico, informe servico_nome, servico_duracao_min e servico_preco.",
      });
    }

    if (!Number.isInteger(duracaoServico) || duracaoServico <= 0) {
      return res.status(400).json({
        erro: "servico_duracao_min deve ser um inteiro positivo.",
      });
    }

    if (Number.isNaN(precoServico) || precoServico < 0) {
      return res.status(400).json({
        erro: "servico_preco invalido.",
      });
    }
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [[barbeiroLogado]] = await conn.query(
      `SELECT id, barbearia_id, ativo
         FROM barbeiro
        WHERE id = ?`,
      [barbeiroId]
    );

    if (!barbeiroLogado) {
      await conn.rollback();
      return res.status(404).json({
        erro: "Barbeiro nao encontrado.",
      });
    }

    if (!barbeiroLogado.ativo) {
      await conn.rollback();
      return res.status(403).json({
        erro: "Barbeiro inativo nao pode criar agendamentos.",
      });
    }

    const barbeariaId = barbeiroLogado.barbearia_id;

    const [[clienteVinculo]] = await conn.query(
      `SELECT cb.id
         FROM cliente_barbearias cb
         JOIN cliente c ON c.id = cb.cliente_id
        WHERE cb.cliente_id = ?
          AND cb.barbearia_id = ?
          AND c.ativo = TRUE`,
      [cliente_id, barbeariaId]
    );

    if (!clienteVinculo) {
      await conn.rollback();
      return res.status(404).json({
        erro: "Cliente nao encontrado nesta barbearia.",
      });
    }

    const [[barbeiro]] = await conn.query(
      `SELECT id
         FROM barbeiro
        WHERE id = ? AND barbearia_id = ? AND ativo = TRUE`,
      [barbeiroId, barbeariaId]
    );

    if (!barbeiro) {
      await conn.rollback();
      return res.status(403).json({
        erro: "Barbeiro inativo ou sem vinculo com a barbearia.",
      });
    }

    let servicoCriado = false;
    let servicoReutilizado = false;
    let resolvedServico;

    if (usandoExistente) {
      const [[servicoExistente]] = await conn.query(
        `SELECT id, duracao_min
           FROM servico
          WHERE id = ? AND barbearia_id = ? AND ativo = TRUE`,
        [servico_id, barbeariaId]
      );

      if (!servicoExistente) {
        await conn.rollback();
        return res.status(404).json({
          erro: "Servico nao encontrado ou inativo.",
        });
      }

      resolvedServico = servicoExistente;
    } else {
      const [[servicoPorNome]] = await conn.query(
        `SELECT id, duracao_min
           FROM servico
          WHERE barbearia_id = ?
            AND ativo = TRUE
            AND TRIM(LOWER(nome)) = TRIM(LOWER(?))
          LIMIT 1`,
        [barbeariaId, nomeServicoNormalizado]
      );

      if (servicoPorNome) {
        resolvedServico = servicoPorNome;
        servicoReutilizado = true;
      } else {
        const [insertServico] = await conn.query(
          `INSERT INTO servico (barbearia_id, nome, duracao_min, preco, ativo)
           VALUES (?, ?, ?, ?, TRUE)`,
          [barbeariaId, nomeServicoNormalizado, duracaoServico, precoServico]
        );

        resolvedServico = {
          id: insertServico.insertId,
          duracao_min: duracaoServico,
        };
        servicoCriado = true;
      }
    }

    const { id: finalServicoId, duracao_min: duracao } = resolvedServico;
    const diaSemana = horarioDate.getDay();
    const horaInicio = horarioDate.toTimeString().slice(0, 8);
    const horaFim = calcularHoraFim(horarioDate, duracao);

    const [[expediente]] = await conn.query(
      `SELECT id
         FROM horario_barbeiro
        WHERE barbeiro_id = ?
          AND dia_semana = ?
          AND hora_inicio <= ?
          AND hora_fim >= ?
          AND ativo = TRUE`,
      [barbeiroId, diaSemana, horaInicio, horaFim]
    );

    if (!expediente) {
      await conn.rollback();
      return res.status(409).json({
        erro: "Horario fora do expediente do barbeiro.",
      });
    }

    const horarioFimDatetime = new Date(
      horarioDate.getTime() + duracao * 60000
    );

    const [[conflitoBarbeiro]] = await conn.query(
      `SELECT a.id
         FROM agendamento a
         JOIN servico s ON s.id = a.servico_id
        WHERE a.barbeiro_id = ?
          AND a.status != 'cancelado'
          AND a.horario < ?
          AND DATE_ADD(a.horario, INTERVAL s.duracao_min MINUTE) > ?`,
      [barbeiroId, horarioFimDatetime, horarioDate]
    );

    if (conflitoBarbeiro) {
      await conn.rollback();
      return res.status(409).json({
        erro: "Barbeiro ja possui agendamento neste horario.",
      });
    }

    const [[conflitoCliente]] = await conn.query(
      `SELECT a.id
         FROM agendamento a
         JOIN servico s ON s.id = a.servico_id
        WHERE a.cliente_id = ?
          AND a.status != 'cancelado'
          AND a.horario < ?
          AND DATE_ADD(a.horario, INTERVAL s.duracao_min MINUTE) > ?`,
      [cliente_id, horarioFimDatetime, horarioDate]
    );

    if (conflitoCliente) {
      await conn.rollback();
      return res.status(409).json({
        erro: "Cliente ja possui agendamento neste horario.",
      });
    }

    const [result] = await conn.query(
      `INSERT INTO agendamento
         (barbearia_id, cliente_id, barbeiro_id, servico_id, horario, status, observacao)
       VALUES (?, ?, ?, ?, ?, 'confirmado', ?)`,
      [
        barbeariaId,
        cliente_id,
        barbeiroId,
        finalServicoId,
        horario,
        observacao ?? null,
      ]
    );

    await conn.commit();

    return res.status(201).json({
      mensagem: "Agendamento criado com sucesso.",
      agendamento_id: result.insertId,
      servico_id: finalServicoId,
      servico_criado: servicoCriado,
      servico_reutilizado: servicoReutilizado,
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({
      erro: "Erro interno ao criar agendamento.",
    });
  } finally {
    conn.release();
  }
});



function calcularHoraFim(date, minutos) {
  const fim = new Date(date.getTime() + minutos * 60000);
  return fim.toTimeString().slice(0, 8);
}

module.exports = router;
