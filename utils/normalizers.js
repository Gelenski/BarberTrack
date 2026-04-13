function normalizeDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeCnpj(value) {
  return normalizeDigits(value);
}

function normalizeTelefone(value) {
  return normalizeDigits(value);
}

module.exports = {
  normalizeDigits,
  normalizeCnpj,
  normalizeTelefone,
};
