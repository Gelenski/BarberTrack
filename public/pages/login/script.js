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
