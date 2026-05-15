const formularioBarbeiro = document.getElementById("barbeiro-form");

const campoNome = document.getElementById("nome");
const campoSobrenome = document.getElementById("sobrenome");
const campoEmail = document.getElementById("email");
const campoTelefone = document.getElementById("telefone");
const campoCpf = document.getElementById("cpf");
const campoSenha = document.getElementById("senha");
const campoConfirmarSenha = document.getElementById("confirmarSenha");

const controleFormulario =
  window.FormularioBarberTrack.criarControleDeFormulario(formularioBarbeiro, {
    textoCarregando: "Cadastrando...",
  });

function removerNaoNumeros(valor) {
  return String(valor || "").replace(/\D/g, "");
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

function cpfEhValido(valor) {
  return removerNaoNumeros(valor).length === 11;
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

function formatarCpf(valor) {
  const numeros = removerNaoNumeros(valor).slice(0, 11);

  if (numeros.length <= 3) {
    return numeros;
  }

  if (numeros.length <= 6) {
    return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
  }

  if (numeros.length <= 9) {
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
  }

  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
}

function pegarDadosDoBarbeiro() {
  return {
    nome: campoNome.value.trim(),
    sobrenome: campoSobrenome.value.trim(),
    email: campoEmail.value.trim(),
    telefone: removerNaoNumeros(campoTelefone.value),
    cpf: removerNaoNumeros(campoCpf.value),
    senha: campoSenha.value,
    confirmarSenha: campoConfirmarSenha.value,
  };
}

function validarNome() {
  const { nome } = pegarDadosDoBarbeiro();

  if (!nome) {
    return "Informe o nome.";
  }

  if (!nomeEhValido(nome)) {
    return "Digite ao menos 2 letras e use apenas caracteres validos.";
  }

  return null;
}

function validarSobrenome() {
  const { sobrenome } = pegarDadosDoBarbeiro();

  if (!sobrenome) {
    return "Informe o sobrenome.";
  }

  if (!nomeEhValido(sobrenome)) {
    return "Digite ao menos 2 letras e use apenas caracteres validos.";
  }

  return null;
}

function validarEmail() {
  const { email } = pegarDadosDoBarbeiro();

  if (!email) {
    return "Informe o email.";
  }

  if (!emailEhValido(email)) {
    return "Digite um email valido.";
  }

  return null;
}

function validarTelefone() {
  const { telefone } = pegarDadosDoBarbeiro();

  if (!telefone) {
    return "Informe o telefone.";
  }

  if (!telefoneEhValido(telefone)) {
    return "Digite um telefone com 10 ou 11 digitos.";
  }

  return null;
}

function validarCpf() {
  const { cpf } = pegarDadosDoBarbeiro();

  if (!cpf) {
    return "Informe o CPF.";
  }

  if (!cpfEhValido(cpf)) {
    return "Digite um CPF com 11 digitos.";
  }

  return null;
}

function validarSenha() {
  const { senha } = pegarDadosDoBarbeiro();
  const senhaRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!senha) {
    return "Informe a senha.";
  }

  if (!senhaRegex.test(senha)) {
    return "A senha deve ter pelo menos 8 caracteres, 1 letra maiúscula, 1 número e 1 caractere especial";
  }

  return null;
}

function validarConfirmacaoDeSenha() {
  const { senha, confirmarSenha } = pegarDadosDoBarbeiro();

  if (!confirmarSenha) {
    return "Confirme a senha.";
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

  if (campo === campoCpf) {
    erro = validarCpf();
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
  const cpfValido = validarCampo(campoCpf);
  const senhaValida = validarCampo(campoSenha);
  const confirmacaoValida = validarCampo(campoConfirmarSenha);

  return (
    nomeValido &&
    sobrenomeValido &&
    emailValido &&
    telefoneValido &&
    cpfValido &&
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

async function enviarCadastro(dadosBarbeiro) {
  const resposta = await fetch("/barbeiro/cadastro", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nome: dadosBarbeiro.nome,
      sobrenome: dadosBarbeiro.sobrenome,
      email: dadosBarbeiro.email,
      telefone: dadosBarbeiro.telefone,
      cpf: dadosBarbeiro.cpf,
      senha: dadosBarbeiro.senha,
    }),
  });

  return controleFormulario.lerJsonDaResposta(resposta);
}

function tratarErroDoBackend(mensagem) {
  if (mensagem === "CPF ja cadastrado para outro barbeiro") {
    controleFormulario.mostrarErroNoCampo(
      campoCpf,
      "Este CPF ja esta vinculado a outro barbeiro."
    );
    return;
  }

  if (mensagem === "Email informado ja esta em uso por outro barbeiro") {
    controleFormulario.mostrarErroNoCampo(
      campoEmail,
      "Este email ja esta vinculado a outro barbeiro."
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
registrarValidacao(campoCpf, () => {
  campoCpf.value = formatarCpf(campoCpf.value);
});
registrarValidacao(campoSenha);
registrarValidacao(campoConfirmarSenha);

formularioBarbeiro.addEventListener("submit", async (event) => {
  event.preventDefault();
  controleFormulario.limparAviso();

  if (!validarFormulario()) {
    controleFormulario.mostrarAviso(
      "Revise os campos destacados para continuar.",
      "error"
    );
    return;
  }

  const dadosBarbeiro = pegarDadosDoBarbeiro();
  controleFormulario.definirEnvio(true);

  try {
    const { resposta, corpo } = await enviarCadastro(dadosBarbeiro);

    if (!resposta.ok) {
      tratarErroDoBackend(
        corpo.error || "Nao foi possivel concluir o cadastro agora."
      );
      return;
    }

    controleFormulario.limparTodosOsCampos();
    formularioBarbeiro.reset();
    controleFormulario.mostrarAviso(
      corpo.message || "Barbeiro cadastrado com sucesso.",
      "success"
    );
  } catch (erro) {
    console.error("Erro ao cadastrar barbeiro:", erro);
    controleFormulario.mostrarAviso(
      "Nao foi possivel conectar ao servidor. Tente novamente em instantes.",
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
