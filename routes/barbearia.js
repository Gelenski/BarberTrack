const express = require("express");
const path = require("path");
const router = express.Router();

router.get("/cadastro", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../public/pages/cadastro_barbearia/index.html")
  );
});

const db = require("../db/db");
const bcrypt = require("bcrypt");

//cadastro de barbearia

router.post("/cadastro ", async (req, res) => {
  try {
    const { nome, cnpj, telefone, senha } = req.body;

    // validação de campos
    if (!nome || !cnpj || !telefone || !senha) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios" });
    }

    //verificar se a barbearia já existe
    const [existe] = await db.execute(
      "SELECT id FROM barbearia WHERE cnpj = ?",
      [cnpj]
    );

    if (existe.length > 0) {
      return res.status(409).json({ error: "Barbearia já cadastrada" });
    }

    //hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    //inserir barbearia no banco
    const [result] = await db.execute(
      "INSERT INTO barbearias (nome, cnpj, telefone, senha) VALUES (?, ?, ?, ?)",
      [nome, cnpj, telefone, senhaHash]
    );
    return res.status(201).json({
      message: "Barbearia cadastrada com sucesso",
      barbearia: {
        id: result.insertId,
        nome,
        cnpj,
      },
    });
  } catch (erro) {
    console.error("Erro ao cadastrar barbearia:", erro);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

module.exports = router;
