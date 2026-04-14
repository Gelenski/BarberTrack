const responseMessages = require("../utils/responseMessages");

function emailEhValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
}

function validateBarbeiroPayload(barbeiro) {
  const { nome, sobrenome, email, telefone, cpf, senha } = barbeiro;

  if (!nome || !sobrenome || !email || !telefone || !cpf || !senha) {
    return responseMessages.requiredBarbeiroFields;
  }

  if (cpf.length !== 11) {
    return responseMessages.invalidCpf;
  }

  if (!emailEhValido(email)) {
    return responseMessages.invalidEmail;
  }

  if (telefone.length < 10 || telefone.length > 11) {
    return responseMessages.invalidTelefone;
  }

  if (senha.length < 8) {
    return responseMessages.invalidPasswordLength;
  }

  return null;
}

module.exports = {
  validateBarbeiroPayload,
};
