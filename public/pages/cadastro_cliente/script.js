const clienteForm = document.querySelector("form");

function isNomeValido(value) {
  return value.length >= 2 && /^[A-Za-zÀ-ÿ\s'-]+$/.test(value);
}

function isEmailValido(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function isTelefoneValido(value) {
  const telefoneNormalizado = value.replace(/\D/g, "");
  return telefoneNormalizado.length >= 10 && telefoneNormalizado.length <= 11;
}

function validarCadastroCliente() {
  const nome = document.getElementById("nome").value.trim();
  const sobrenome = document.getElementById("sobrenome").value.trim();
  const email = document.getElementById("email").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const senha = document.getElementById("senha").value;
  const confirmarSenha = document.getElementById("confirmarsenha").value;

  if (!isNomeValido(nome)) {
    return "Nome invalido. Insira ao menos 2 letras.";
  }

  if (!isNomeValido(sobrenome)) {
    return "Sobrenome invalido. Insira ao menos 2 letras.";
  }

  if (!isEmailValido(email)) {
    return "Email invalido.";
  }

  if (!isTelefoneValido(telefone)) {
    return "Telefone invalido.";
  }

  if (senha.length < 8) {
    return "A senha deve ter no minimo 8 caracteres.";
  }

  if (senha !== confirmarSenha) {
    return "As senhas nao coincidem.";
  }

  return null;
}

clienteForm.addEventListener("submit", function handleClienteSubmit(event) {
  event.preventDefault();

  const validationError = validarCadastroCliente();
  if (validationError) {
    alert(validationError);
    return;
  }

  this.submit();
});
