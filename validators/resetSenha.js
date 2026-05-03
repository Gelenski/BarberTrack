const responseMessages = require("../utils/responseMessages");

function validateResetSenhaPayload(payload) {
  const { email, tipo } = payload;

  if (!email || !tipo) {
    return responseMessages.requiredResetFields;
  }

  return null;
}

function validateNovaSenhaPayload(payload) {
  const { token, senha } = payload;

  if (!token || !senha) {
    return responseMessages.requiredNewPasswordFields;
  }

  if (senha.length < 8) {
    return responseMessages.invalidPasswordLength;
  }

  return null;
}

module.exports = { validateResetSenhaPayload, validateNovaSenhaPayload };
