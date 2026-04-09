const app = require("./app");
const db = require("./db/db");

const PORT = 3000;

db.getConnection((err) => {
  if (err) {
    console.log("Erro ao conectar no banco:", err);
  } else {
    console.log("Banco conectado com sucesso");
  }
});

app.listen(PORT, () => {
  console.log("Servidor rodando em http://localhost:" + PORT);
});
