const express = require("express");
const path = require("path");
const router = express.Router();
// const db = require("../db/db");
// const bcrypt = require("bcrypt");

router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/login/index.html"));
});

module.exports = router;

// REALMENTE NÃO ENTENDI A FUNCIONALIDADE DESSE ARQUIVO, POIS CADA SESSÃO SERÁ CRIADA EM SEU PRÓPRIO LOGIN
