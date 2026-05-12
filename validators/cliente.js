const responseMessages = require("../utils/responseMessages");

function validateClientePayload(cliente) {
  const requiredFields = [
    cliente.nome,
    cliente.sobrenome,
    cliente.email,
    cliente.telefone,
    cliente.senha,
  ];

  if (requiredFields.some((field) => !field)) {
    return responseMessages.requiredClienteFields;
  }

  return null;
}

module.exports = {
  validateClientePayload,
};

function validateRegisterClientePayload(cliente) {
  const requiredFields = [
    cliente.nome,
    cliente.sobrenome,
    cliente.email,
    cliente.telefone,
    cliente.senha,
  ];

  if (requiredFields.some((field) => !field)) {
    return responseMessages.requiredClienteFields;
  }

  // Validação do array
  if (
    !Array.isArray(cliente.barbeariasIds) ||
    cliente.barbeariasIds.length === 0
  ) {
    return "barbeariasIds deve ser um array com pelo menos um id";
  }

  return null;
}

module.exports = {
  validateClientePayload,
  validateRegisterClientePayload,
};
