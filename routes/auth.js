const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("../db/db");
const createSession = require("../utils/createSession");
const { resolveAuthProfile } = require("../utils/authProfile");
const responseMessages = require("../utils/responseMessages");
const { validateLoginPayload } = require("../validators/auth");

const router = express.Router();

router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/login/index.html"));
});

router.post("/login", async (req, res) => {
  const { email, senha, tipo } = req.body;
  const validationError = validateLoginPayload({ email, senha });

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const perfil = resolveAuthProfile(tipo);

  try {
    // O perfil concentra as diferencas entre cliente e barbearia no fluxo de login.
    const [usuarios] = await db.execute(
      `SELECT id, ${perfil.campoNome} AS nome, email, senha FROM ${perfil.tabela} WHERE email = ?`,
      [email]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ error: responseMessages.userNotFound });
    }

    const usuario = usuarios[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res
        .status(401)
        .json({ error: responseMessages.invalidCredentials });
    }

    // A sessao recebe apenas os dados necessarios para identificar e autorizar o usuario.
    const usuarioSeguro = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
    };

    return createSession(req, usuarioSeguro, perfil.tipo, (sessionError) => {
      if (sessionError) {
        console.error("Erro ao criar sessao", sessionError);
        return res.status(500).json({ error: responseMessages.sessionError });
      }

      return res.json({
        success: true,
        redirect: perfil.redirectPath,
        nome: usuarioSeguro.nome,
      });
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: responseMessages.processingError });
  }
});

module.exports = router;
