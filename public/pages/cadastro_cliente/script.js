let btn = document.getElementById("btn-cadastrar");

document.addEventListener("DOMContentLoaded", () => {
  btn.addEventListener("click", async () => {
    let nome = document.getElementById("nome").value.trim();
    let sobrenome = document.getElementById("sobrenome").value.trim();
    let email = document.getElementById("email").value.trim();
    let telefone = document.getElementById("telefone").value.trim();
    let senha = document.getElementById("senha").value;
    let confirmarSenha = document.getElementById("confirmar-senha").value;

    // Validação básica
    if (
      !nome ||
      !sobrenome ||
      !email ||
      !telefone ||
      !senha ||
      !confirmarSenha
    ) {
      alert("Preencha todos os campos.");
      return;
    }

    let emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValido.test(email)) {
      alert("Email inválido.");
      return;
    }

    if (senha.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      alert("As senhas não coincidem.");
      return;
    }

    let usuario = { nome, sobrenome, email, telefone, senha };
    console.log(usuario);
    try {
      // Feedback de loading
      btn.disabled = true;
      btn.innerText = "Cadastrando...";

      const response = await fetch("http://localhost:3000/cliente/cadastro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(usuario),
      });

      if (!response.ok) {
        throw new Error("Erro ao cadastrar usuário");
      }

      const data = await response.json();

      console.log("Sucesso:", data);
      alert("Cadastro realizado com sucesso!");

      // Limpar formulário
      document.getElementById("nome").value = "";
      document.getElementById("sobrenome").value = "";
      document.getElementById("email").value = "";
      document.getElementById("telefone").value = "";
      document.getElementById("senha").value = "";
      document.getElementById("confirmar-senha").value = "";
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao cadastrar. Tente novamente.");
    } finally {
      btn.disabled = false;
      btn.innerText = "Cadastrar";
    }
  });
});
