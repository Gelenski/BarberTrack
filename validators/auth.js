function validateLoginPayload(loginPayload) {
  const { email, senha } = loginPayload;

  if (!email || !senha) {
    return "Email e senha sao obrigatorios";
  }

  return null;
}

module.exports = {
  validateLoginPayload,
};
