const express = require("express");
const path = require("path");
const router = express.Router();

router.get("/cadastro", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/cadastro_barbearia/index.html"));
});

module.exports = router;