const formularioLogin = document.getElementById("form");
const campoEmail = document.getElementById("email");
const campoSenha = document.getElementById("senha");
const campoPerfil = document.getElementById("tipo-perfil");

const controleFormulario =
  window.FormularioBarberTrack.criarControleDeFormulario(formularioLogin, {
    textoCarregando: "Entrando...",
  });

function pegarDadosDoLogin() {
  return {
    email: campoEmail.value.trim(),
    senha: campoSenha.value.trim(),
    tipo: campoPerfil.value,
  };
}

function validarEmail() {
  const { email } = pegarDadosDoLogin();

  if (!email) {
    return "Informe seu email.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return "Digite um email valido.";
  }

  return null;
}

function validarSenha() {
  const { senha } = pegarDadosDoLogin();

  if (!senha) {
    return "Informe sua senha.";
  }

  return null;
}

function validarPerfil() {
  const { tipo } = pegarDadosDoLogin();

  if (!tipo) {
    return "Selecione como deseja entrar.";
  }

  return null;
}

function validarCampo(campo) {
  let erro = null;

  if (campo === campoEmail) {
    erro = validarEmail();
  }

  if (campo === campoSenha) {
    erro = validarSenha();
  }

  if (campo === campoPerfil) {
    erro = validarPerfil();
  }

  if (erro) {
    controleFormulario.mostrarErroNoCampo(campo, erro);
    return false;
  }

  if (campo.value.trim()) {
    controleFormulario.mostrarCampoValido(campo);
  } else {
    controleFormulario.limparCampo(campo);
  }

  return true;
}

function validarFormulario() {
  const emailValido = validarCampo(campoEmail);
  const senhaValida = validarCampo(campoSenha);
  const perfilValido = validarCampo(campoPerfil);

  return emailValido && senhaValida && perfilValido;
}

function registrarEventosDeValidacao(campo, eventoDeDigitacao = "input") {
  campo.addEventListener("blur", () => {
    validarCampo(campo);
  });

  campo.addEventListener(eventoDeDigitacao, () => {
    controleFormulario.limparAviso();
    validarCampo(campo);
  });
}

function salvarUsuarioLogado(respostaLogin, tipo) {
  localStorage.setItem(
    "usuarioLogado",
    JSON.stringify({
      nome: respostaLogin.nome,
      tipo,
    })
  );
}

async function enviarLogin(dadosLogin) {
  const resposta = await fetch("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dadosLogin),
  });

  return controleFormulario.lerJsonDaResposta(resposta);
}

registrarEventosDeValidacao(campoEmail);
registrarEventosDeValidacao(campoSenha);
registrarEventosDeValidacao(campoPerfil, "change");

formularioLogin.addEventListener("submit", async (event) => {
  event.preventDefault();
  controleFormulario.limparAviso();

  if (!validarFormulario()) {
    controleFormulario.mostrarAviso(
      "Revise os campos destacados para continuar.",
      "error"
    );
    return;
  }

  const dadosLogin = pegarDadosDoLogin();
  controleFormulario.definirEnvio(true);

  try {
    const { resposta, corpo } = await enviarLogin(dadosLogin);

    if (!resposta.ok) {
      controleFormulario.mostrarAviso(
        corpo.error || "Não foi possível entrar. Verifique seus dados.",
        "error"
      );
      return;
    }

    salvarUsuarioLogado(corpo, dadosLogin.tipo);
    controleFormulario.mostrarAviso(
      "Login realizado com sucesso. Redirecionando...",
      "success"
    );
    window.location.href = corpo.redirect;
  } catch (erro) {
    console.error("Erro na conexao:", erro);
    controleFormulario.mostrarAviso(
      "Não foi possível conectar ao servidor. Tente novamente em instantes.",
      "error"
    );
  } finally {
    controleFormulario.definirEnvio(false);
  }
});

document.querySelectorAll(".bt-toggle-senha").forEach((botao) => {
  botao.addEventListener("click", () => {
    const input = document.getElementById(botao.dataset.target);
    const visivel = input.type === "text";

    input.type = visivel ? "password" : "text";
    botao.setAttribute(
      "aria-label",
      visivel ? "Mostrar senha" : "Ocultar senha"
    );

    botao.innerHTML = visivel
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>`;
  });
});
