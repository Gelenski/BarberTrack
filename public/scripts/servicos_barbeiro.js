document.addEventListener("DOMContentLoaded", () => {
  configurarFormulario();
  configurarLogout();
  carregarServicos();
});

async function carregarServicos() {
  const status = document.getElementById("servicos-status");
  const lista = document.getElementById("servicos-lista");

  try {
    const resposta = await fetch("/barbeiro/servicos");
    const corpo = await resposta.json();

    if (!resposta.ok) {
      throw new Error(corpo.error || "Nao foi possivel carregar os servicos.");
    }

    const servicos = corpo.servicos || [];

    if (!servicos.length) {
      status.style.display = "block";
      status.textContent = "Nenhum servico cadastrado ainda.";
      status.className = "bt-form-status is-info";
      lista.innerHTML = "";
      return;
    }

    status.style.display = "none";
    lista.innerHTML = servicos
      .map(
        (servico) => `
          <div class="bt-list-row">
            <span class="bt-list-title">${servico.nome}</span>
            <span class="bt-list-meta is-gold">${servico.duracao_min} min · R$ ${Number(servico.preco).toFixed(2)}</span>
          </div>
        `
      )
      .join("");
  } catch (error) {
    status.style.display = "block";
    status.textContent = error.message || "Erro ao carregar os servicos.";
    status.className = "bt-form-status is-error";
    lista.innerHTML = "";
  }
}

function configurarFormulario() {
  const form = document.getElementById("servico-form");
  form.addEventListener("submit", enviarServico);
}

async function enviarServico(event) {
  event.preventDefault();

  const btn = document.getElementById("btn-salvar-servico");
  const status = document.getElementById("form-status");
  const payload = {
    nome: document.getElementById("nome").value.trim(),
    duracao_min: Number(document.getElementById("duracao_min").value),
    preco: Number(document.getElementById("preco").value),
  };

  if (!payload.nome || !payload.duracao_min || Number.isNaN(payload.preco)) {
    status.style.display = "block";
    status.textContent = "Preencha nome, duracao e preco do servico.";
    status.className = "bt-form-status is-error";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Salvando...";
  status.style.display = "block";
  status.textContent = "Cadastrando servico...";
  status.className = "bt-form-status is-info";

  try {
    const resposta = await fetch("/barbeiro/servicos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const corpo = await resposta.json();

    if (!resposta.ok) {
      throw new Error(corpo.error || corpo.erro || "Nao foi possivel salvar.");
    }

    status.textContent = corpo.message || "Servico cadastrado com sucesso.";
    status.className = "bt-form-status is-success";
    document.getElementById("servico-form").reset();
    carregarServicos();
  } catch (error) {
    status.textContent = error.message || "Erro ao cadastrar servico.";
    status.className = "bt-form-status is-error";
  } finally {
    btn.disabled = false;
    btn.textContent = "Salvar servico";
  }
}

function configurarLogout() {
  document.getElementById("btn-logout").addEventListener("click", async () => {
    const btn = document.getElementById("btn-logout");
    btn.disabled = true;

    try {
      const res = await fetch("/auth/logout", { method: "POST" });
      const data = await res.json();
      window.location.href = data.redirect || "/auth/login";
    } catch {
      window.location.href = "/auth/login";
    }
  });
}
