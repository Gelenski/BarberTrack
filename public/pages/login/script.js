const loginForm = document.getElementById("form");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");
const perfilInput = document.getElementById("tipo-perfil");

function buildLoginPayload() {
  return {
    email: emailInput.value.trim(),
    senha: senhaInput.value.trim(),
    tipo: perfilInput.value,
  };
}

function saveLoggedUser(loginResponse, tipo) {
  // O front salva apenas dados simples para personalizacao local da interface.
  localStorage.setItem(
    "usuarioLogado",
    JSON.stringify({
      nome: loginResponse.nome,
      tipo,
    })
  );
}

async function submitLogin(loginPayload) {
  // Centralizamos a chamada para manter request e parsing da resposta no mesmo lugar.
  const response = await fetch("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginPayload),
  });

  const responseBody = await response.json();

  return { response, responseBody };
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const loginPayload = buildLoginPayload();

  try {
    const { response, responseBody } = await submitLogin(loginPayload);

    if (!response.ok) {
      alert(
        "Erro no login: " + (responseBody.error || "Verifique suas credenciais")
      );
      return;
    }

    saveLoggedUser(responseBody, loginPayload.tipo);
    alert("Login realizado com sucesso!");
    window.location.href = responseBody.redirect;
  } catch (error) {
    console.error("Erro na conexao:", error);
    alert("Nao foi possivel conectar ao servidor.");
  }
});
