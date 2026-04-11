const express = require("express");
const path = require("path");
const router = express.Router();
const db = require("../db/db");
const bcrypt = require("bcrypt");
<<<<<<< HEAD
=======
const createSession = require("../utils/createSession");
>>>>>>> 21afcab380d6c4fec9ec9c4ec5f34c85be87876c

router.get("/cadastro", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../public/pages/cadastro_cliente/index.html")
  );
});

<<<<<<< HEAD
=======
// * --- ROTA DE CADASTRO DE CLIENTE ---

>>>>>>> 21afcab380d6c4fec9ec9c4ec5f34c85be87876c
router.post("/cadastro", async (req, res) => {
  try {
    const { nome, sobrenome, email, telefone, senha } = req.body;

<<<<<<< HEAD
    if (!nome || nome.length < 2 || !/^[A-Za-zÀ-ÿ\s'-]+$/.test(nome.trim())) {
      return res.status(400).json({ error: "Nome inválido." });
    }
    if (
      !sobrenome ||
      sobrenome.length < 2 ||
      !/^[A-Za-zÀ-ÿ\s'-]+$/.test(sobrenome.trim())
    ) {
      return res.status(400).json({ error: "Sobrenome inválido." });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      return res.status(400).json({ error: "Email inválido." });
    }
    const digits = telefone?.replace(/\D/g, "");
    if (!digits || digits.length < 10 || digits.length > 11) {
      return res.status(400).json({ error: "Telefone inválido." });
    }
    if (!senha || senha.length < 8) {
      return res
        .status(400)
        .json({ error: "Senha deve ter no mínimo 8 caracteres." });
=======
    if (!nome || !sobrenome || !email || !telefone || !senha) {
      return res.status(400).json({
        error: "Todos os campos são obrigatórios.",
      });
>>>>>>> 21afcab380d6c4fec9ec9c4ec5f34c85be87876c
    }

    const [clienteExiste] = await db.execute(
      "SELECT id FROM cliente WHERE email = ?",
      [email]
    );
<<<<<<< HEAD
    if (clienteExiste.length > 0) {
      return res.status(409).json({
        error: "Email já cadastrado",
      });
    }
=======

    if (clienteExiste.length > 0) {
      return res.status(409).json({
        error: "Email já cadastrado.",
      });
    }

>>>>>>> 21afcab380d6c4fec9ec9c4ec5f34c85be87876c
    const senhaHash = await bcrypt.hash(senha, 10);

    const [result] = await db.execute(
      "INSERT INTO cliente (barbearia_id, nome, sobrenome, email, telefone, senha) VALUES (1,?,?,?,?,?);",
      [nome, sobrenome, email, telefone, senhaHash]
    );

    return res.status(201).json({
      message: "Usuário cadastrado com sucesso.",
      user: {
        id: result.insertId,
        nome,
        email,
      },
    });
  } catch (erro) {
<<<<<<< HEAD
    console.error("Detalhes do erro:", erro.message);
=======
>>>>>>> 21afcab380d6c4fec9ec9c4ec5f34c85be87876c
    console.error("Erro no cadastro:", erro);
    return res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
});

<<<<<<< HEAD
=======
// * --- ROTA DE LOGIN DE CLIENTE ---

router.post("/login", async (req, res) => {
  try {
    let { email, senha } = req.body;

    email = email.trim().toLowerCase();
    senha = senha.trim();

    if (!email || !senha) {
      return res.status(400).json({
        error: "Email e senha são obrigatórios.",
      });
    }

    const [result] = await db.execute(
      "SELECT id, nome, email, senha FROM cliente WHERE email = ?",
      [email]
    );

    if (result.length === 0) {
      return res.status(401).json({
        error: "Email ou senha inválidos.",
      });
    }

    const user = result[0];

    const senhaCorreta = await bcrypt.compare(senha, user.senha);

    if (!senhaCorreta) {
      return res.status(401).json({
        error: "Email ou senha inválidos.",
      });
    }

    const safeUser = {
      id: user.id,
      nome: user.nome,
      email: user.email,
    };

    // * Criação da sessão ao login
    createSession(req, safeUser, "cliente", (err) => {
      if (err) {
        console.error("Erro ao iniciar sessão:", err);
        return res.status(500).json({
          error: "Erro ao iniciar sessão",
        });
      }

      return res.status(200).json({
        message: "Login realizado com sucesso.",
        user: safeUser,
      });
    });
  } catch (erro) {
    console.log("Erro interno no login do cliente:", erro);
    return res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
});

>>>>>>> 21afcab380d6c4fec9ec9c4ec5f34c85be87876c
module.exports = router;
