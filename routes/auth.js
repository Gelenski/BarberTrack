const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("../db/db");
const createSession = require("../utils/createSession");
const { resolveAuthProfile } = require("../utils/authProfile");
const responseMessages = require("../utils/responseMessages");
const { sendResetEmail } = require("../utils/sendEmail");
const { validateLoginPayload } = require("../validators/auth");
const {
  validateResetSenhaPayload,
  validateNovaSenhaPayload,
} = require("../validators/resetSenha");

const router = express.Router();

// ─── Login

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

// ─── Reset de senha

router.get("/reset-senha", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/reset_senha/index.html"));
});

router.post("/reset-senha", async (req, res) => {
  const { email, tipo } = req.body;

  const validationError = validateResetSenhaPayload({ email, tipo });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const perfil = resolveAuthProfile(tipo);

  try {
    const [usuarios] = await db.execute(
      `SELECT id FROM ${perfil.tabela} WHERE email = ?`,
      [email]
    );

    // Mesmo que o email nao exista, retornamos sucesso para nao expor quais emails estao cadastrados.
    if (usuarios.length === 0) {
      return res.json({
        success: true,
        message: responseMessages.resetEmailSent,
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiraEm = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

    await db.execute(
      "INSERT INTO reset_senha (email, tipo, token, expira_em) VALUES (?, ?, ?, ?)",
      [email, perfil.tipo, token, expiraEm]
    );

    await sendResetEmail(email, token);

    return res.json({
      success: true,
      message: responseMessages.resetEmailSent,
    });
  } catch (error) {
    console.error("Erro ao solicitar reset de senha:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

// ─── Nova senha

router.get("/nova-senha", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../public/pages/reset_senha/nova_senha/index.html")
  );
});

router.post("/nova-senha", async (req, res) => {
  const { token, senha } = req.body;

  const validationError = validateNovaSenhaPayload({ token, senha });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const [tokens] = await db.execute(
      "SELECT * FROM reset_senha WHERE token = ? AND usado = FALSE AND expira_em > NOW()",
      [token]
    );

    if (tokens.length === 0) {
      return res
        .status(400)
        .json({ error: responseMessages.invalidResetToken });
    }

    const resetToken = tokens[0];
    const perfil = resolveAuthProfile(resetToken.tipo);
    const senhaHash = await bcrypt.hash(senha, 10);

    await db.execute(`UPDATE ${perfil.tabela} SET senha = ? WHERE email = ?`, [
      senhaHash,
      resetToken.email,
    ]);

    // Invalida o token apos o uso.
    await db.execute("UPDATE reset_senha SET usado = TRUE WHERE token = ?", [
      token,
    ]);

    return res.json({
      success: true,
      message: responseMessages.passwordUpdated,
    });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return res
      .status(500)
      .json({ error: responseMessages.internalServerError });
  }
});

module.exports = router;
