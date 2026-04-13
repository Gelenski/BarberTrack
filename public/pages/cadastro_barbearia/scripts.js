document.querySelector("form").addEventListener("submit", function (e) {
  e.preventDefault();

  const nome_fantasia = document
    .querySelector('[name="nome_fantasia"]')
    .value.trim();
  const razao_social = document
    .querySelector('[name="razao_social"]')
    .value.trim();
  const cnpj = document.querySelector('[name="cnpj"]').value.trim();
  const email = document.querySelector('[name="email"]').value.trim();
  const telefone = document.querySelector('[name="telefone"]').value.trim();
  const senha = document.querySelector('[name="senha"]').value;
  const confirmar = document.getElementById("confirmarSenha").value;

  if (!nome_fantasia) {
    alert("Nome fantasia é obrigatório.");
    return;
  }
  if (!razao_social) {
    alert("Razão social é obrigatória.");
    return;
  }
  const cnpjLimpo = cnpj.replace(/\D/g, "");
  if (!cnpj || cnpjLimpo.length !== 14) {
    alert("CNPJ inválido. Ele deve conter 14 dígitos.");
    return;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    alert("Email inválido.");
    return;
  }
  if (telefone) {
    const telLimpo = telefone.replace(/\D/g, "");
    if (telLimpo.length < 10 || telLimpo.length > 11) {
      alert("Telefone inválido. Ele deve conter 10 ou 11 dígitos.");
      return;
    }
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
