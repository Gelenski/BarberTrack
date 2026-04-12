document.querySelector("form").addEventListener("submit", function (e) {
  e.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const sobrenome = document.getElementById("sobrenome").value.trim();
  const email = document.getElementById("email").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const senha = document.getElementById("senha").value;
  const confirmar = document.getElementById("confirmarsenha").value;

  if (!nome || nome.length < 2 || !/^[A-Za-zÀ-ÿ\s'-]+$/.test(nome)) {
    alert("Nome inválido. Insira ao menos 2 letras.");
    return;
  }
  if (
    !sobrenome ||
    sobrenome.length < 2 ||
    !/^[A-Za-zÀ-ÿ\s'-]+$/.test(sobrenome)
  ) {
    alert("Sobrenome inválido. Insira ao menos 2 letras.");
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    alert("Email inválido.");
    return;
  }
  const digits = telefone.replace(/\D/g, "");
  if (!digits || digits.length < 10 || digits.length > 11) {
    alert("Telefone inválido.");
    return;
  }
  if (senha.length < 8) {
    alert("A senha deve ter no mínimo 8 caracteres.");
    return;
  }
  if (senha !== confirmar) {
    alert("As senhas não coincidem.");
    return;
  }

  this.submit();
});