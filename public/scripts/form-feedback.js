function lerJsonDaResposta(resposta) {
  return resposta
    .text()
    .then((texto) => {
      if (!texto) {
        return {};
      }

      try {
        return JSON.parse(texto);
      } catch (erro) {
        console.error("Resposta JSON invalida:", erro);
        return {};
      }
    })
    .then((corpo) => ({ resposta, corpo }));
}

function pegarContainerDoCampo(campo) {
  return campo.closest("[data-field]") || campo.parentElement;
}

function pegarMensagemDoCampo(campo) {
  const container = pegarContainerDoCampo(campo);
  let mensagem = container.querySelector(".bt-field-message");

  if (!mensagem) {
    mensagem = document.createElement("p");
    mensagem.className = "bt-field-message";
    mensagem.id = `${campo.id || campo.name}-error`;
    container.appendChild(mensagem);
  }

  campo.setAttribute("aria-describedby", mensagem.id);

  return mensagem;
}

function criarControleDeFormulario(formulario, opcoes = {}) {
  const botaoEnviar =
    formulario.querySelector(opcoes.seletorBotao || '[type="submit"]') || null;
  const textoPadraoDoBotao =
    opcoes.textoPadraoDoBotao ||
    (botaoEnviar ? botaoEnviar.textContent.trim() : "Enviar");
  const textoCarregando = opcoes.textoCarregando || "Enviando...";

  let avisoDoFormulario = formulario.querySelector(".bt-form-status");

  if (!avisoDoFormulario) {
    avisoDoFormulario = document.createElement("div");
    avisoDoFormulario.className = "bt-form-status";
    avisoDoFormulario.setAttribute("aria-live", "polite");
    avisoDoFormulario.hidden = true;
    formulario.prepend(avisoDoFormulario);
  }

  function mostrarErroNoCampo(campo, mensagem) {
    const mensagemDoCampo = pegarMensagemDoCampo(campo);

    campo.classList.add("is-invalid");
    campo.classList.remove("is-valid");
    campo.setAttribute("aria-invalid", "true");

    mensagemDoCampo.textContent = mensagem;
    mensagemDoCampo.classList.add("is-visible");
  }

  function mostrarCampoValido(campo) {
    const mensagemDoCampo = pegarMensagemDoCampo(campo);

    campo.classList.remove("is-invalid");
    campo.classList.add("is-valid");
    campo.setAttribute("aria-invalid", "false");

    mensagemDoCampo.textContent = "";
    mensagemDoCampo.classList.remove("is-visible");
  }

  function limparCampo(campo) {
    const mensagemDoCampo = pegarMensagemDoCampo(campo);

    campo.classList.remove("is-invalid", "is-valid");
    campo.setAttribute("aria-invalid", "false");

    mensagemDoCampo.textContent = "";
    mensagemDoCampo.classList.remove("is-visible");
  }

  function limparTodosOsCampos() {
    formulario
      .querySelectorAll("input, select, textarea")
      .forEach((campo) => limparCampo(campo));
  }

  function mostrarAviso(mensagem, tipo = "info") {
    avisoDoFormulario.hidden = false;
    avisoDoFormulario.textContent = mensagem;
    avisoDoFormulario.className = `bt-form-status is-${tipo}`;
  }

  function limparAviso() {
    avisoDoFormulario.hidden = true;
    avisoDoFormulario.textContent = "";
    avisoDoFormulario.className = "bt-form-status";
  }

  function definirEnvio(estaEnviando) {
    formulario.classList.toggle("is-submitting", estaEnviando);

    if (!botaoEnviar) {
      return;
    }

    botaoEnviar.disabled = estaEnviando;
    botaoEnviar.setAttribute("aria-busy", String(estaEnviando));
    botaoEnviar.textContent = estaEnviando
      ? textoCarregando
      : textoPadraoDoBotao;
  }

  return {
    definirEnvio,
    lerJsonDaResposta,
    limparAviso,
    limparCampo,
    limparTodosOsCampos,
    mostrarAviso,
    mostrarCampoValido,
    mostrarErroNoCampo,
  };
}

window.FormularioBarberTrack = {
  criarControleDeFormulario,
};
