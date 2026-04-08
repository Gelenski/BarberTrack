const app = require("./app");
const db = require("./db/db");
const PORT = 3000;

try {
  db.getConnection((err) => {
    console.log("ERRO DO MYSQL2 " + err);
  });
  console.log("Banco conectado");
} catch (erro) {
  console.log("DEU RUIM CONNECTING TO BD:", erro);
}

app.listen(PORT, () => {
  console.log("O servidor está rodando na porta " + PORT);
});
