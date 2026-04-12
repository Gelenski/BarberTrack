const express = require("express");
const path = require("path");
const router = express.Router();
const db = require("../db/db");
const bcrypt = require("bcrypt");
const createSession = require("../utils/createSession");

router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/login/index.html"));
});

router.post("/login", async (req, res) => {
  const { email, senha, tipo } = req.body;

  //definir a tabela com base no tipo de perfil

  const tabela = tipo === "barbearia" ? "barbearia" : "cliente"; //if ternário
  const campoNome = tipo === "barbearia" ? "nome_fantasia" : "nome";
  const redirectPath =
    tipo === "barbearia" ? "/barbearia/dashboard" : "/cliente/dashboard";

  try {
    const [usuarios] = await db.execute(
      `SELECT id, ${campoNome} AS nome, email, senha FROM ${tabela} WHERE email = ?`,
      [email]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    const usuario = usuarios[0];
    const match = await bcrypt.compare(senha, usuario.senha);

    if (match) {
      const safeUser = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      };

      createSession(req, safeUser, tipo, (err) => {
        if (err) {
          console.error("Erro ao criar sessão", err);
          return res.status(500).json({ error: "Erro ao iniciar sessão" });
        }
        return res.json({
          success: true,
          redirect: redirectPath,
          nome: safeUser.nome,
        });
      });
    } else {
      return res.status(401).json({ error: "E-mail ou senha incorreto" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro no processamento" });
  }
});

module.exports = router;
