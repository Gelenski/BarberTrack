const responseMessages = require("../utils/responseMessages");
const { normalizeTelefone } = require("../utils/normalizers");

function emailEhValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
}

// Valida o payload de edição de cliente.
// Todos os campos são opcionais — só valida formato se o campo foi enviado.
// Retorna string de erro ou null.
function validateEdicaoClientePayload(cliente) {
  const { nome, sobrenome, email, telefone, senha } = cliente;

  if (nome !== undefined && !String(nome).trim()) {
    return "Nome não pode ser vazio.";
  }

  if (sobrenome !== undefined && !String(sobrenome).trim()) {
    return "Sobrenome não pode ser vazio.";
  }

  if (email !== undefined) {
    if (!email || !emailEhValido(email)) {
      return responseMessages.invalidEmail;
    }
  }

  if (telefone !== undefined) {
    const tel = normalizeTelefone(telefone);
    if (tel.length < 10 || tel.length > 11) {
      return responseMessages.invalidTelefone;
    }
  }

  if (senha !== undefined) {
    if (!senha || senha.length < 8) {
      return responseMessages.invalidPasswordLength;
    }
  }

  return null;
}

module.exports = { validateEdicaoClientePayload };
