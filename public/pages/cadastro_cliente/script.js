const formularioCliente = document.getElementById("cliente-form");

const campoNome = document.getElementById("nome");
const campoSobrenome = document.getElementById("sobrenome");
const campoEmail = document.getElementById("email");
const campoTelefone = document.getElementById("telefone");
const campoSenha = document.getElementById("senha");
const campoConfirmarSenha = document.getElementById("confirmarsenha");

const controleFormulario =
  window.FormularioBarberTrack.criarControleDeFormulario(formularioCliente, {
    textoCarregando: "Cadastrando...",
  });

function removerNaoNumeros(valor) {
  return valor.replace(/\D/g, "");
}

function nomeEhValido(valor) {
  return valor.length >= 2 && /^[A-Za-zÀ-ÿ\s'-]+$/.test(valor);
}

function emailEhValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
}

function telefoneEhValido(valor) {
  const telefoneSemMascara = removerNaoNumeros(valor);
  return telefoneSemMascara.length >= 10 && telefoneSemMascara.length <= 11;
}

function formatarTelefone(valor) {
  const numeros = removerNaoNumeros(valor).slice(0, 11);

  if (numeros.length <= 2) {
    return numeros;
  }

  if (numeros.length <= 6) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  if (numeros.length <= 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

function pegarDadosDoCliente() {
  return {
    nome: campoNome.value.trim(),
    sobrenome: campoSobrenome.value.trim(),
    email: campoEmail.value.trim(),
    telefone: removerNaoNumeros(campoTelefone.value),
    senha: campoSenha.value,
    confirmarSenha: campoConfirmarSenha.value,
  };
}

function validarNome() {
  const { nome } = pegarDadosDoCliente();

  if (!nome) {
    return "Informe seu nome.";
  }

  if (!nomeEhValido(nome)) {
    return "Digite ao menos 2 letras e use apenas caracteres validos.";
  }

  return null;
}

function validarSobrenome() {
  const { sobrenome } = pegarDadosDoCliente();

  if (!sobrenome) {
    return "Informe seu sobrenome.";
  }

  if (!nomeEhValido(sobrenome)) {
    return "Digite ao menos 2 letras e use apenas caracteres validos.";
  }

  return null;
}

function validarEmail() {
  const { email } = pegarDadosDoCliente();

  if (!email) {
    return "Informe seu email.";
  }

  if (!emailEhValido(email)) {
    return "Digite um email valido.";
  }

  return null;
}

function validarTelefone() {
  const { telefone } = pegarDadosDoCliente();

  if (!telefone) {
    return "Informe seu telefone.";
  }

  if (!telefoneEhValido(telefone)) {
    return "Digite um telefone com 10 ou 11 digitos.";
  }

  return null;
}

function validarSenha() {
  const { senha } = pegarDadosDoCliente();

  if (!senha) {
    return "Informe uma senha.";
  }

  if (senha.length < 8) {
    return "A senha deve ter pelo menos 8 caracteres.";
  }

  return null;
}

function validarConfirmacaoDeSenha() {
  const { senha, confirmarSenha } = pegarDadosDoCliente();

  if (!confirmarSenha) {
    return "Confirme sua senha.";
  }

  if (senha !== confirmarSenha) {
    return "As senhas nao coincidem.";
  }

  return null;
}

function validarCampo(campo) {
  let erro = null;

  if (campo === campoNome) {
    erro = validarNome();
  }

  if (campo === campoSobrenome) {
    erro = validarSobrenome();
  }

  if (campo === campoEmail) {
    erro = validarEmail();
  }

  if (campo === campoTelefone) {
    erro = validarTelefone();
  }

  if (campo === campoSenha) {
    erro = validarSenha();
  }

  if (campo === campoConfirmarSenha) {
    erro = validarConfirmacaoDeSenha();
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
  const nomeValido = validarCampo(campoNome);
  const sobrenomeValido = validarCampo(campoSobrenome);
  const emailValido = validarCampo(campoEmail);
  const telefoneValido = validarCampo(campoTelefone);
  const senhaValida = validarCampo(campoSenha);
  const confirmacaoValida = validarCampo(campoConfirmarSenha);

  return (
    nomeValido &&
    sobrenomeValido &&
    emailValido &&
    telefoneValido &&
    senhaValida &&
    confirmacaoValida
  );
}

function registrarValidacao(campo, aoDigitar) {
  campo.addEventListener("blur", () => {
    validarCampo(campo);
  });

  campo.addEventListener("input", () => {
    controleFormulario.limparAviso();

    if (aoDigitar) {
      aoDigitar();
    }

    validarCampo(campo);

    if (campo === campoSenha || campo === campoConfirmarSenha) {
      validarCampo(campoConfirmarSenha);
    }
  });
}

async function enviarCadastro(dadosCliente) {
  const resposta = await fetch("/cliente/cadastro", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nome: dadosCliente.nome,
      sobrenome: dadosCliente.sobrenome,
      email: dadosCliente.email,
      telefone: dadosCliente.telefone,
      senha: dadosCliente.senha,
    }),
  });

  return controleFormulario.lerJsonDaResposta(resposta);
}

function tratarErroDoBackend(mensagem) {
  if (mensagem === "Email ja cadastrado.") {
    controleFormulario.mostrarErroNoCampo(
      campoEmail,
      "Este email ja esta cadastrado."
    );
    return;
  }

  controleFormulario.mostrarAviso(mensagem, "error");
}

registrarValidacao(campoNome);
registrarValidacao(campoSobrenome);
registrarValidacao(campoEmail);
registrarValidacao(campoTelefone, () => {
  campoTelefone.value = formatarTelefone(campoTelefone.value);
});
registrarValidacao(campoSenha);
registrarValidacao(campoConfirmarSenha);

formularioCliente.addEventListener("submit", async (event) => {
  event.preventDefault();
  controleFormulario.limparAviso();

  if (!validarFormulario()) {
    controleFormulario.mostrarAviso(
      "Revise os campos destacados para continuar.",
      "error"
    );
    return;
  }

  const dadosCliente = pegarDadosDoCliente();
  controleFormulario.definirEnvio(true);

  try {
    const { resposta, corpo } = await enviarCadastro(dadosCliente);

    if (!resposta.ok) {
      tratarErroDoBackend(
        corpo.error || "Nao foi possivel concluir o cadastro agora."
      );
      return;
    }

    controleFormulario.limparTodosOsCampos();
    formularioCliente.reset();
    controleFormulario.mostrarAviso(
      corpo.message ||
        "Cadastro realizado com sucesso. Redirecionando para o login...",
      "success"
    );

    window.setTimeout(() => {
      window.location.href = "/auth/login";
    }, 1400);
  } catch (erro) {
    console.error("Erro ao cadastrar cliente:", erro);
    controleFormulario.mostrarAviso(
      "Nao foi possivel conectar ao servidor. Tente novamente em instantes.",
      "error"
    );
  } finally {
    controleFormulario.definirEnvio(false);
  }
});
