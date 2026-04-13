const responseMessages = require("../utils/responseMessages");

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  // Dashboards protegidos continuam levando o usuário para a tela de login.
  return res.redirect("/auth/login");
}

function isBarbearia(req, res, next) {
  if (req.session?.user?.tipo === "barbearia") {
    return next();
  }

  return res.status(403).send(responseMessages.accessDenied);
}

function isCliente(req, res, next) {
  if (req.session?.user?.tipo === "cliente") {
    return next();
  }

  return res.status(403).send(responseMessages.accessDenied);
}

module.exports = { isAuthenticated, isBarbearia, isCliente };
