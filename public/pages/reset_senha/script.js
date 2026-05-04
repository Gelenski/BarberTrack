const form = document.getElementById("reset-form");
const emailInput = document.getElementById("email");
const tipoInput = document.getElementById("tipo-perfil");

const { definirEnvio, mostrarAviso, limparAviso, mostrarErroNoCampo } =
  window.FormularioBarberTrack.criarControleDeFormulario(form);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  limparAviso();

  // Validação no front antes de enviar
  if (!tipoInput.value) {
    mostrarErroNoCampo(tipoInput, "Selecione seu perfil.");
    return;
  }

  if (!emailInput.value.trim()) {
    mostrarErroNoCampo(emailInput, "Informe seu e-mail.");
    return;
  }

  const dados = {
    email: emailInput.value.trim(),
    tipo: tipoInput.value,
  };

  definirEnvio(true);

  try {
    const resposta = await fetch("/auth/reset-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    const resultado = await resposta.json();

    if (resposta.ok) {
      mostrarAviso(
        "Se este e-mail estiver cadastrado, você receberá o link em breve.",
        "success"
      );
      form.reset();
    } else {
      mostrarAviso(resultado.error || "Tente novamente.", "error");
    }
  } catch (erro) {
    console.error("Erro na conexão:", erro);
    mostrarAviso("Não foi possível conectar ao servidor.", "error");
  } finally {
    definirEnvio(false);
  }
});
