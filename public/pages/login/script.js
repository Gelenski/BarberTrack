const formLogin = document.getElementById("form");
const emailLogin = document.getElementById("email");
const senhaLogin = document.getElementById("senha");

formLogin.addEventListener("submit", async (event) => {
  event.preventDefault(); // impede o POST padrão do form

  const dadosLogin = {
    email: emailLogin.value.trim(),
    senha: senhaLogin.value.trim(),
  };

  try {
    const resposta = await fetch("/cliente/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dadosLogin),
    });

    const resultado = await resposta.json();

    if (resposta.ok) {
      alert("Login realizado com sucesso!");
      window.location.href = "/cliente/dashboard"; // ajuste para sua rota
    } else {
      alert(
        "Erro no login: " + (resultado.error || "Verifique suas credenciais")
      );
    }
  } catch (erro) {
    console.error("Erro na conexão:", erro);
    alert("Não foi possível conectar ao servidor.");
  }
});
