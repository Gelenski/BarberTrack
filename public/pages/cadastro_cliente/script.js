<<<<<<< HEAD
document.querySelector("form").addEventListener("submit", function (e) {
  e.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const sobrenome = document.getElementById("sobrenome").value.trim();
  const email = document.getElementById("email").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const senha = document.getElementById("senha").value;
  const confirmar = document.getElementById("confirmarsenha").value;

  if (!nome || nome.length < 2 || !/^[A-Za-zÀ-ÿ\s'-]+$/.test(nome)) {
    alert("Nome inválido. Insira ao menos 2 letras.");
    return;
  }
  if (
    !sobrenome ||
    sobrenome.length < 2 ||
    !/^[A-Za-zÀ-ÿ\s'-]+$/.test(sobrenome)
  ) {
    alert("Sobrenome inválido. Insira ao menos 2 letras.");
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    alert("Email inválido.");
    return;
  }
  const digits = telefone.replace(/\D/g, "");
  if (!digits || digits.length < 10 || digits.length > 11) {
    alert("Telefone inválido.");
    return;
  }
  if (senha.length < 8) {
    alert("A senha deve ter no mínimo 8 caracteres.");
    return;
  }
  if (senha !== confirmar) {
    alert("As senhas não coincidem.");
    return;
  }

  this.submit();
=======
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
>>>>>>> 21afcab380d6c4fec9ec9c4ec5f34c85be87876c
});
