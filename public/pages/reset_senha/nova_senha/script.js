const form = document.getElementById("nova-senha-form");
const senhaInput = document.getElementById("senha");
const confirmarSenhaInput = document.getElementById("confirmarsenha");

const {
  definirEnvio,
  mostrarAviso,
  limparAviso,
  mostrarErroNoCampo,
  mostrarCampoValido,
  limparCampo,
} = window.FormularioBarberTrack.criarControleDeFormulario(form);

// Pega o token da URL: /auth/nova-senha?token=xxxxx
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

// Se não tiver token na URL, redireciona pro login
if (!token) {
  mostrarAviso("Link inválido ou expirado.", "error");
  setTimeout(() => {
    window.location.href = "/auth/login";
  }, 2000);
}

function validarSenha() {
  const senha = senhaInput.value;
  const senhaRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!senha) {
    return "Informe uma senha.";
  }

  if (!senhaRegex.test(senha)) {
    return "A senha deve ter pelo menos 8 caracteres, 1 letra maiúscula, 1 número e 1 caractere especial";
  }

  return null;
}

function validarConfirmacaoDeSenha() {
  const senha = senhaInput.value;
  const confirmarSenha = confirmarSenhaInput.value;

  if (!confirmarSenha) {
    return "Confirme sua senha.";
  }

  if (senha !== confirmarSenha) {
    return "As senhas nao coincidem.";
  }

  return null;
}

function validarCampoIndividual(input, funcaoValidacao) {
  const erro = funcaoValidacao();
  if (erro) {
    mostrarErroNoCampo(input, erro);
  } else if (input.value.length > 0) {
    mostrarCampoValido(input);
  } else {
    limparCampo(input);
  }
}

[senhaInput, confirmarSenhaInput].forEach((input) => {
  input.addEventListener("input", () => {
    limparAviso();
    if (input === senhaInput) {
      validarCampoIndividual(senhaInput, validarSenha);
      // Sempre revalida a confirmação quando a senha principal muda
      validarCampoIndividual(confirmarSenhaInput, validarConfirmacaoDeSenha);
    } else {
      validarCampoIndividual(confirmarSenhaInput, validarConfirmacaoDeSenha);
    }
  });

  input.addEventListener("blur", () => {
    if (input === senhaInput) {
      validarCampoIndividual(senhaInput, validarSenha);
    } else {
      validarCampoIndividual(confirmarSenhaInput, validarConfirmacaoDeSenha);
    }
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  limparAviso();

  const erroSenha = validarSenha();
  if (erroSenha) {
    mostrarErroNoCampo(senhaInput, erroSenha);
    return;
  }

  const erroConfirmacao = validarConfirmacaoDeSenha();
  if (erroConfirmacao) {
    mostrarErroNoCampo(confirmarSenhaInput, erroConfirmacao);
    return;
  }

  const dados = {
    token,
    senha: senhaInput.value.trim(),
  };

  definirEnvio(true);

  try {
    const resposta = await fetch("/auth/nova-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    const resultado = await resposta.json();

    if (resposta.ok) {
      mostrarAviso(
        "Senha redefinida com sucesso! Redirecionando...",
        "success"
      );
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);
    } else {
      mostrarAviso(resultado.error || "Link inválido ou expirado.", "error");
    }
  } catch (erro) {
    console.error("Erro na conexão:", erro);
    mostrarAviso("Não foi possível conectar ao servidor.", "error");
  } finally {
    definirEnvio(false);
  }
});
