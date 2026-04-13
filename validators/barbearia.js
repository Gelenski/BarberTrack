const { normalizeCnpj, normalizeTelefone } = require("../utils/normalizers");
const responseMessages = require("../utils/responseMessages");

function validateBarbeariaPayload(barbearia) {
  const { nomeFantasia, razaoSocial, cnpj, telefone, senha } = barbearia;

  if (!nomeFantasia || !razaoSocial || !cnpj || !senha) {
    return responseMessages.invalidBarbeariaFields;
  }

  if (normalizeCnpj(cnpj).length !== 14) {
    return responseMessages.invalidCnpj;
  }

  if (telefone) {
    const telefoneNormalizado = normalizeTelefone(telefone);

    if (
      telefoneNormalizado.length > 0 &&
      (telefoneNormalizado.length < 10 || telefoneNormalizado.length > 11)
    ) {
      return responseMessages.invalidTelefone;
    }
  }

  if (senha.length < 8) {
    return responseMessages.invalidPasswordLength;
  }

  return null;
}

module.exports = {
  validateBarbeariaPayload,
};
