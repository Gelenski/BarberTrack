document.addEventListener("DOMContentLoaded", () => {
  inicializarUsuario();
  inicializarSidebar();
  configurarLogout();
  carregarBarbearias();
});

function inicializarUsuario() {
  try {
    const u = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (u?.nome) {
      document.getElementById("nome-cliente").textContent = u.nome;
      const avatar = document.getElementById("avatar-inicial");
      if (avatar) avatar.textContent = u.nome[0].toUpperCase();
    }
  } catch {
    /* intencional */
  }
}

async function carregarBarbearias() {
  const status = document.getElementById("barbearias-status");
  const lista = document.getElementById("barbearias-lista");

  try {
    const res = await fetch("/cliente/barbearias");
    const corpo = await res.json();
    if (!res.ok) throw new Error(corpo.error || "Erro ao carregar barbearias.");

    const barbearias = corpo.barbearias || [];

    if (!barbearias.length) {
      status.textContent =
        "Nenhuma barbearia vinculada. Peça o código de acesso à barbearia.";
      status.className = "bt-form-status is-info";
      lista.innerHTML = "";
      return;
    }

    status.style.display = "none";
    lista.innerHTML = barbearias
      .map(
        (b) => `
      <div class="barber-item">
        <div class="barber-avatar">${b.nome_fantasia[0].toUpperCase()}</div>
        <div class="barber-info">
          <div class="barber-name">${b.nome_fantasia}</div>
          <div class="barber-role">${b.email || b.telefone || "Barbearia"}</div>
        </div>
        <a href="/cliente/agendamento?barbearia_id=${b.id}" class="btn-primary" style="font-size:.8rem;padding:.4rem .9rem;">
          Agendar
        </a>
      </div>`
      )
      .join("");
  } catch (error) {
    status.textContent = error.message || "Erro ao carregar barbearias.";
    status.className = "bt-form-status is-error";
  }
}

function inicializarSidebar() {
  const btn = document.getElementById("btn-hamburger");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const aberto = sidebar.classList.contains("is-open");
    sidebar.classList.toggle("is-open", !aberto);
    overlay.classList.toggle("is-open", !aberto);
    btn.classList.toggle("is-open", !aberto);
  });
  overlay.addEventListener("click", () => {
    sidebar.classList.remove("is-open");
    overlay.classList.remove("is-open");
    btn.classList.remove("is-open");
  });
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
