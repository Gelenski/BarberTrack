const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db/db");
const { isAuthenticated, isBarbearia } = require("../middleware/auth");
const responseMessages = require("../utils/responseMessages");
const { normalizeDigits, normalizeTelefone } = require("../utils/normalizers");
const {
  validateEdicaoBarbeiroPayload,
} = require("../validators/edicaoBarbeiro");
const { validateEdicaoClientePayload } = require("../validators/edicaoCliente");

const router = express.Router();

// ─── GET /api/usuarios/barbeiros
router.get("/barbeiros", isAuthenticated, isBarbearia, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, nome, sobrenome, email, telefone, cpf, ativo, created_at
       FROM barbeiro
       WHERE barbearia_id = ?
       ORDER BY nome ASC`,
      [req.session.user.id]
    );

    const barbeiros = rows.map((b) => ({
      ...b,
      nome_completo: `${b.nome} ${b.sobrenome}`,
      iniciais: (b.nome[0] + b.sobrenome[0]).toUpperCase(),
    }));

    return res.json({ barbeiros });
  } catch (error) {
    console.error("Erro ao listar barbeiros:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

// ─── GET /api/usuarios/clientes
router.get("/clientes", isAuthenticated, isBarbearia, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, nome, sobrenome, email, telefone, ativo, created_at
       FROM cliente
       ORDER BY nome ASC`
    );

    const clientes = rows.map((c) => ({
      ...c,
      nome_completo: `${c.nome} ${c.sobrenome}`,
      iniciais: (c.nome[0] + c.sobrenome[0]).toUpperCase(),
    }));

    return res.json({ clientes });
  } catch (error) {
    console.error("Erro ao listar clientes:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

// ─── PATCH /api/usuarios/barbeiro/:id/status
router.patch(
  "/barbeiro/:id/status",
  isAuthenticated,
  isBarbearia,
  async (req, res) => {
    const { id } = req.params;
    const { ativo } = req.body;

    if (typeof ativo !== "boolean") {
      return res.status(400).json({ error: "Campo 'ativo' deve ser boolean." });
    }

    try {
      const [rows] = await db.execute(
        "SELECT id FROM barbeiro WHERE id = ? AND barbearia_id = ?",
        [id, req.session.user.id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Barbeiro não encontrado." });
      }

      await db.execute("UPDATE barbeiro SET ativo = ? WHERE id = ?", [
        ativo,
        id,
      ]);

      return res.json({
        success: true,
        message: ativo ? "Barbeiro ativado." : "Barbeiro desativado.",
      });
    } catch (error) {
      console.error("Erro ao atualizar status do barbeiro:", error);
      return res
        .status(500)
        .json({ error: responseMessages.internalServerError });
    }
  }
);

// ─── PATCH /api/usuarios/cliente/:id/status
router.patch(
  "/cliente/:id/status",
  isAuthenticated,
  isBarbearia,
  async (req, res) => {
    const { id } = req.params;
    const { ativo } = req.body;

    if (typeof ativo !== "boolean") {
      return res.status(400).json({ error: "Campo 'ativo' deve ser boolean." });
    }

    try {
      const [rows] = await db.execute("SELECT id FROM cliente WHERE id = ?", [
        id,
      ]);

      if (rows.length === 0) {
        return res.status(404).json({ error: "Cliente não encontrado." });
      }

      await db.execute("UPDATE cliente SET ativo = ? WHERE id = ?", [
        ativo,
        id,
      ]);

      return res.json({
        success: true,
        message: ativo ? "Cliente ativado." : "Cliente desativado.",
      });
    } catch (error) {
      console.error("Erro ao atualizar status do cliente:", error);
      return res
        .status(500)
        .json({ error: responseMessages.internalServerError });
    }
  }
);

// ─── PATCH /api/usuarios/barbeiro/:id
// Edita dados de um barbeiro da barbearia logada
router.patch(
  "/barbeiro/:id",
  isAuthenticated,
  isBarbearia,
  async (req, res) => {
    const { id } = req.params;
    const { nome, sobrenome, email, telefone, cpf, senha } = req.body;

    // Normaliza campos de formato antes de validar
    const payload = {
      ...(nome !== undefined && { nome: String(nome).trim() }),
      ...(sobrenome !== undefined && { sobrenome: String(sobrenome).trim() }),
      ...(email !== undefined && { email: String(email).trim() }),
      ...(telefone !== undefined && { telefone: normalizeTelefone(telefone) }),
      ...(cpf !== undefined && { cpf: normalizeDigits(cpf) }),
      ...(senha !== undefined && { senha }),
    };

    const validationError = validateEdicaoBarbeiroPayload(payload);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    try {
      // Garante que o barbeiro pertence à barbearia logada
      const [rows] = await db.execute(
        "SELECT id FROM barbeiro WHERE id = ? AND barbearia_id = ?",
        [id, req.session.user.id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Barbeiro não encontrado." });
      }

      // Checagem de duplicatas — ignora o próprio registro
      if (payload.email) {
        const [emailRows] = await db.execute(
          "SELECT id FROM barbeiro WHERE email = ? AND id != ?",
          [payload.email, id]
        );
        if (emailRows.length > 0) {
          return res
            .status(409)
            .json({ error: responseMessages.duplicateBarbeiroEmail });
        }
      }

      if (payload.cpf) {
        const [cpfRows] = await db.execute(
          "SELECT id FROM barbeiro WHERE cpf = ? AND id != ?",
          [payload.cpf, id]
        );
        if (cpfRows.length > 0) {
          return res
            .status(409)
            .json({ error: responseMessages.duplicateBarbeiroCpf });
        }
      }

      // Monta SET dinâmico apenas com os campos enviados
      const campos = [];
      const valores = [];

      if (payload.nome) {
        campos.push("nome = ?");
        valores.push(payload.nome);
      }
      if (payload.sobrenome) {
        campos.push("sobrenome = ?");
        valores.push(payload.sobrenome);
      }
      if (payload.email) {
        campos.push("email = ?");
        valores.push(payload.email);
      }
      if (payload.telefone) {
        campos.push("telefone = ?");
        valores.push(payload.telefone);
      }
      if (payload.cpf) {
        campos.push("cpf = ?");
        valores.push(payload.cpf);
      }
      if (payload.senha) {
        const senhaHash = await bcrypt.hash(payload.senha, 10);
        campos.push("senha = ?");
        valores.push(senhaHash);
      }

      if (campos.length === 0) {
        return res.status(400).json({ error: "Nenhum campo para atualizar." });
      }

      valores.push(id);
      await db.execute(
        `UPDATE barbeiro SET ${campos.join(", ")} WHERE id = ?`,
        valores
      );

      return res.json({
        success: true,
        message: "Barbeiro atualizado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao editar barbeiro:", error);
      return res
        .status(500)
        .json({ error: responseMessages.internalServerError });
    }
  }
);

// ─── PATCH /api/usuarios/cliente/:id
// Edita dados de um cliente
router.patch("/cliente/:id", isAuthenticated, isBarbearia, async (req, res) => {
  const { id } = req.params;
  const { nome, sobrenome, email, telefone, senha } = req.body;

  const payload = {
    ...(nome !== undefined && { nome: String(nome).trim() }),
    ...(sobrenome !== undefined && { sobrenome: String(sobrenome).trim() }),
    ...(email !== undefined && { email: String(email).trim() }),
    ...(telefone !== undefined && { telefone: normalizeTelefone(telefone) }),
    ...(senha !== undefined && { senha }),
  };

  const validationError = validateEdicaoClientePayload(payload);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const [rows] = await db.execute("SELECT id FROM cliente WHERE id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Cliente não encontrado." });
    }

    // Checagem de email duplicado — ignora o próprio registro
    if (payload.email) {
      const [emailRows] = await db.execute(
        "SELECT id FROM cliente WHERE email = ? AND id != ?",
        [payload.email, id]
      );
      if (emailRows.length > 0) {
        return res
          .status(409)
          .json({ error: responseMessages.duplicateClienteEmail });
      }
    }

    const campos = [];
    const valores = [];

    if (payload.nome) {
      campos.push("nome = ?");
      valores.push(payload.nome);
    }
    if (payload.sobrenome) {
      campos.push("sobrenome = ?");
      valores.push(payload.sobrenome);
    }
    if (payload.email) {
      campos.push("email = ?");
      valores.push(payload.email);
    }
    if (payload.telefone) {
      campos.push("telefone = ?");
      valores.push(payload.telefone);
    }
    if (payload.senha) {
      const senhaHash = await bcrypt.hash(payload.senha, 10);
      campos.push("senha = ?");
      valores.push(senhaHash);
    }

    if (campos.length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar." });
    }

    valores.push(id);
    await db.execute(
      `UPDATE cliente SET ${campos.join(", ")} WHERE id = ?`,
      valores
    );

    return res.json({
      success: true,
      message: "Cliente atualizado com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao editar cliente:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

module.exports = router;
