const barbeariaForm = document.querySelector("form");

function isEmailValido(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function normalizeDigits(value) {
  return value.replace(/\D/g, "");
}

function isTelefoneValido(value) {
  const telefoneNormalizado = normalizeDigits(value);
  return telefoneNormalizado.length >= 10 && telefoneNormalizado.length <= 11;
}

function validarCadastroBarbearia() {
  const nomeFantasia = document
    .querySelector('[name="nome_fantasia"]')
    .value.trim();
  const razaoSocial = document
    .querySelector('[name="razao_social"]')
    .value.trim();
  const cnpj = document.querySelector('[name="cnpj"]').value.trim();
  const email = document.querySelector('[name="email"]').value.trim();
  const telefone = document.querySelector('[name="telefone"]').value.trim();
  const senha = document.querySelector('[name="senha"]').value;
  const confirmarSenha = document.getElementById("confirmarSenha").value;
  const cnpjNormalizado = normalizeDigits(cnpj);

  if (!nomeFantasia) {
    return "Nome fantasia e obrigatorio.";
  }

  if (!razaoSocial) {
    return "Razao social e obrigatoria.";
  }

  if (cnpjNormalizado.length !== 14) {
    return "CNPJ invalido. Ele deve conter 14 digitos.";
  }

  if (email && !isEmailValido(email)) {
    return "Email invalido.";
  }

  if (telefone && !isTelefoneValido(telefone)) {
    return "Telefone invalido. Ele deve conter 10 ou 11 digitos.";
  }

  if (senha.length < 8) {
    return "A senha deve ter no minimo 8 caracteres.";
  }

  if (senha !== confirmarSenha) {
    return "As senhas nao coincidem.";
  }

  return null;
}

barbeariaForm.addEventListener("submit", function handleBarbeariaSubmit(event) {
  event.preventDefault();

  const validationError = validarCadastroBarbearia();
  if (validationError) {
    alert(validationError);
    return;
  }

  this.submit();
});
