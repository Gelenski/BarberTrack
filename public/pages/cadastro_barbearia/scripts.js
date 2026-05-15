const formularioBarbearia = document.getElementById("barbearia-form");

const campoNomeFantasia = document.getElementById("nome_fantasia");
const campoRazaoSocial = document.getElementById("razao_social");
const campoCnpj = document.getElementById("cnpj");
const campoEmail = document.getElementById("email");
const campoTelefone = document.getElementById("telefone");
const campoSenha = document.getElementById("senha");
const campoConfirmarSenha = document.getElementById("confirmarSenha");

const controleFormulario =
  window.FormularioBarberTrack.criarControleDeFormulario(formularioBarbearia, {
    textoCarregando: "Cadastrando...",
  });

function removerNaoNumeros(valor) {
  return valor.replace(/\D/g, "");
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

function formatarCnpj(valor) {
  const numeros = removerNaoNumeros(valor).slice(0, 14);

  if (numeros.length <= 2) {
    return numeros;
  }

  if (numeros.length <= 5) {
    return `${numeros.slice(0, 2)}.${numeros.slice(2)}`;
  }

  if (numeros.length <= 8) {
    return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5)}`;
  }

  if (numeros.length <= 12) {
    return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8)}`;
  }

  return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8, 12)}-${numeros.slice(12)}`;
}

function pegarDadosDaBarbearia() {
  return {
    nomeFantasia: campoNomeFantasia.value.trim(),
    razaoSocial: campoRazaoSocial.value.trim(),
    cnpj: removerNaoNumeros(campoCnpj.value),
    email: campoEmail.value.trim(),
    telefone: removerNaoNumeros(campoTelefone.value),
    senha: campoSenha.value,
    confirmarSenha: campoConfirmarSenha.value,
  };
}

function validarNomeFantasia() {
  const { nomeFantasia } = pegarDadosDaBarbearia();

  if (!nomeFantasia) {
    return "Informe o nome fantasia.";
  }

  return null;
}

function validarRazaoSocial() {
  const { razaoSocial } = pegarDadosDaBarbearia();

  if (!razaoSocial) {
    return "Informe a razao social.";
  }

  return null;
}

function validarCnpj() {
  const { cnpj } = pegarDadosDaBarbearia();

  if (!cnpj) {
    return "Informe o CNPJ.";
  }

  if (cnpj.length !== 14) {
    return "O CNPJ deve conter 14 digitos.";
  }

  return null;
}

function validarEmail() {
  const { email } = pegarDadosDaBarbearia();

  if (email && !emailEhValido(email)) {
    return "Digite um email valido.";
  }

  return null;
}

function validarTelefone() {
  const { telefone } = pegarDadosDaBarbearia();

  if (telefone && !telefoneEhValido(telefone)) {
    return "Digite um telefone com 10 ou 11 digitos.";
  }

  return null;
}

function validarSenha() {
  const { senha } = pegarDadosDaBarbearia();
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
  const { senha, confirmarSenha } = pegarDadosDaBarbearia();

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

  if (campo === campoNomeFantasia) {
    erro = validarNomeFantasia();
  }

  if (campo === campoRazaoSocial) {
    erro = validarRazaoSocial();
  }

  if (campo === campoCnpj) {
    erro = validarCnpj();
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
  const nomeFantasiaValido = validarCampo(campoNomeFantasia);
  const razaoSocialValida = validarCampo(campoRazaoSocial);
  const cnpjValido = validarCampo(campoCnpj);
  const emailValido = validarCampo(campoEmail);
  const telefoneValido = validarCampo(campoTelefone);
  const senhaValida = validarCampo(campoSenha);
  const confirmacaoValida = validarCampo(campoConfirmarSenha);

  return (
    nomeFantasiaValido &&
    razaoSocialValida &&
    cnpjValido &&
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

async function enviarCadastro(dadosBarbearia) {
  const resposta = await fetch("/barbearia/cadastro", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nome_fantasia: dadosBarbearia.nomeFantasia,
      razao_social: dadosBarbearia.razaoSocial,
      cnpj: dadosBarbearia.cnpj,
      email: dadosBarbearia.email,
      telefone: dadosBarbearia.telefone,
      senha: dadosBarbearia.senha,
    }),
  });

  return controleFormulario.lerJsonDaResposta(resposta);
}

function tratarErroDoBackend(mensagem) {
  if (mensagem === "Email informado ja esta em uso") {
    controleFormulario.mostrarErroNoCampo(
      campoEmail,
      "Este email ja esta vinculado a outra barbearia."
    );
    return;
  }

  if (mensagem === "Telefone informado ja esta em uso") {
    controleFormulario.mostrarErroNoCampo(
      campoTelefone,
      "Este telefone ja esta vinculado a outra barbearia."
    );
    return;
  }

  if (mensagem === "Cnpj ja cadastrado") {
    controleFormulario.mostrarErroNoCampo(
      campoCnpj,
      "Este CNPJ ja esta cadastrado."
    );
    return;
  }

  controleFormulario.mostrarAviso(mensagem, "error");
}

registrarValidacao(campoNomeFantasia);
registrarValidacao(campoRazaoSocial);
registrarValidacao(campoCnpj, () => {
  campoCnpj.value = formatarCnpj(campoCnpj.value);
});
registrarValidacao(campoEmail);
registrarValidacao(campoTelefone, () => {
  campoTelefone.value = formatarTelefone(campoTelefone.value);
});
registrarValidacao(campoSenha);
registrarValidacao(campoConfirmarSenha);

formularioBarbearia.addEventListener("submit", async (event) => {
  event.preventDefault();
  controleFormulario.limparAviso();

  if (!validarFormulario()) {
    controleFormulario.mostrarAviso(
      "Revise os campos destacados para continuar.",
      "error"
    );
    return;
  }

  const dadosBarbearia = pegarDadosDaBarbearia();
  controleFormulario.definirEnvio(true);

  try {
    const { resposta, corpo } = await enviarCadastro(dadosBarbearia);

    if (!resposta.ok) {
      tratarErroDoBackend(
        corpo.error || "Nao foi possivel concluir o cadastro agora."
      );
      return;
    }

    controleFormulario.limparTodosOsCampos();
    formularioBarbearia.reset();
    controleFormulario.mostrarAviso(
      corpo.message ||
        "Cadastro realizado com sucesso. Redirecionando para o login...",
      "success"
    );

    window.setTimeout(() => {
      window.location.href = "/auth/login";
    }, 1400);
  } catch (erro) {
    console.error("Erro ao cadastrar barbearia:", erro);
    controleFormulario.mostrarAviso(
      "Nao foi possivel conectar ao servidor. Tente novamente em instantes.",
      "error"
    );
  } finally {
    controleFormulario.definirEnvio(false);
  }
});
