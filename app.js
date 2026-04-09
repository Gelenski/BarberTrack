const express = require("express");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", require("./routes/index"));
app.use("/auth", require("./routes/auth"));
app.use("/barbearia", require("./routes/barbearia"));

module.exports = app;
