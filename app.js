const express = require("express");
const session = require("express-session");
const path = require("path");
const dotenv = require("dotenv");
const responseMessages = require("./utils/responseMessages");

const app = express();

dotenv.config();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: "barbertrack.sid",
    secret: process.env.SESSION_SECRET || "secret-test",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use("/", require("./routes/index"));
app.use("/auth", require("./routes/auth"));
app.use("/cliente", require("./routes/cliente"));
app.use("/barbearia", require("./routes/barbearia"));
app.use("/barbeiro", require("./routes/barbeiro"));
app.use("/agendamento", require("./routes/agendamento"));
app.use("/api/usuarios", require("./routes/usuarios"));

app.get("/teste-user", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: responseMessages.unauthenticated });
  }

  return res.json({
    message: responseMessages.authenticated,
    user: req.session.user,
  });
});

module.exports = app;
