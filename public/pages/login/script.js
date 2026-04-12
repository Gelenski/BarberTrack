const formLogin = document.getElementById("form");
const emailLogin = document.getElementById("email");
const senhaLogin = document.getElementById("senha");
const perfilLogin = document.getElementById("tipo-perfil");

formLogin.addEventListener("submit", async (event) => {
  event.preventDefault(); // impede o POST padrão do form

  const dadosLogin = {
    email: emailLogin.value.trim(),
    senha: senhaLogin.value.trim(),
    tipo: perfilLogin.value,
  };

  try {
    const resposta = await fetch("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dadosLogin),
    });

    const resultado = await resposta.json();

    if (resposta.ok) {
      localStorage.setItem(
        "usuarioLogado",
        JSON.stringify({
          nome: resultado.nome,
          tipo: dadosLogin.tipo,
        })
      );

      alert("Login realizado com sucesso!");

      window.location.href = resultado.redirect;
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
