const form = document.getElementById("nova-senha-form");
const senhaInput = document.getElementById("senha");
const confirmarSenhaInput = document.getElementById("confirmarsenha");

const { definirEnvio, mostrarAviso, limparAviso, mostrarErroNoCampo } =
  window.FormularioBarberTrack.criarControleDeFormulario(form);

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

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  limparAviso();

  // Validações no front antes de enviar
  if (senhaInput.value.length < 8) {
    mostrarErroNoCampo(senhaInput, "A senha deve ter pelo menos 8 caracteres.");
    return;
  }

  if (senhaInput.value !== confirmarSenhaInput.value) {
    mostrarErroNoCampo(confirmarSenhaInput, "As senhas não coincidem.");
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
