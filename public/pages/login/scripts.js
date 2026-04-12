//Elementos DOM

const formLogin = document.getElementById("form");
const emailLogin = document.getElementById("email");
const senhaLogin = document.getElementById("senha");

formLogin.addEventListener("submit", async (event) => {
  event.preventDefault();

  const dadosLogin = {
    email: emailLogin.value,
    senha: senhaLogin.value,
  };

  try {
    const resposta = await fetch("/barbearia/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dadosLogin),
    });

    const resultado = await resposta.json();

    if (resposta.ok) {
      alert("Login realizado com sucesso");
    } else {
      alert(
        "Erro no login: " + (resultado.error || "Verifique suas credencias")
      );
    }
  } catch (erro) {
    console.log("Erro na conexão", erro);
  }
});
