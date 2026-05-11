// ─── Init
document.addEventListener("DOMContentLoaded", () => {
  inicializarUsuario();
  mostrarData();
  carregarBarbearias();
  carregarAgendamentos();
  inicializarSidebar();

  document.getElementById("btn-logout").addEventListener("click", logout);
});

// ─── Usuário
function inicializarUsuario() {
  try {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (usuario?.nome) {
      document.getElementById("nome-cliente").textContent = usuario.nome;
      document.getElementById("avatar-inicial").textContent =
        usuario.nome[0].toUpperCase();
    }
  } catch (_) {}
}

function mostrarData() {
  const hoje = new Date();
  const opts = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  document.getElementById("data-atual").textContent = hoje.toLocaleDateString(
    "pt-BR",
    opts
  );
}

// ─── Barbearias
async function carregarBarbearias() {
  const grid = document.getElementById("barbearia-grid");
  grid.innerHTML = renderSkeleton(3);

  try {
    const res = await fetch("/cliente/barbearias");
    if (!res.ok) throw new Error();
    const { barbearias } = await res.json();

    if (!barbearias.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon">✂</span>
          <h3>Nenhuma barbearia disponível</h3>
          <p>Ainda não há barbearias cadastradas no sistema.</p>
        </div>`;
      return;
    }

    grid.innerHTML = barbearias.map(renderCard).join("");
  } catch (_) {
    grid.innerHTML = `<p style="color:var(--muted);font-size:.85rem;">Erro ao carregar barbearias.</p>`;
  }
}

function renderCard(b) {
  const info =
    [b.email, b.telefone].filter(Boolean).join(" · ") ||
    "Sem contato cadastrado";
  return `
    <div class="barbearia-card">
      <div class="barbearia-card-icon">✂</div>
      <div class="barbearia-card-name">${b.nome_fantasia}</div>
      <div class="barbearia-card-info">${info}</div>
      <div class="barbearia-card-actions">
        <a class="btn-ver-agenda" href="/cliente/agenda?barbearia_id=${b.id}">
          Ver agenda →
        </a>
      </div>
    </div>`;
}

function renderSkeleton(n) {
  return Array.from(
    { length: n },
    () => `<div class="barber-skeleton" style="height:140px;"></div>`
  ).join("");
}

// ─── Agendamentos do cliente
async function carregarAgendamentos() {
  const lista = document.getElementById("agendamentos-list");
  lista.innerHTML = `<div style="padding:1.5rem;color:var(--muted);font-size:.85rem;">Carregando...</div>`;

  try {
    const res = await fetch("/cliente/agendamentos");
    if (!res.ok) throw new Error();
    const { agendamentos } = await res.json();

    const proximos = agendamentos.filter(
      (a) => new Date(a.horario) >= new Date() && a.status !== "cancelado"
    );

    if (!proximos.length) {
      lista.innerHTML = `<p style="color:var(--muted);font-size:.82rem;padding:.5rem 0;">Nenhum agendamento futuro.</p>`;
      return;
    }

    lista.innerHTML = proximos
      .slice(0, 5)
      .map((a) => {
        const dt = new Date(a.horario);
        const hora = dt.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const data = dt.toLocaleDateString("pt-BR", {
          day: "numeric",
          month: "short",
        });
        return `
          <div class="agenda-item">
            <span class="agenda-time">${hora}</span>
            <div class="agenda-divider"></div>
            <div class="agenda-info">
              <div class="agenda-client">${a.barbearia_nome}</div>
              <div class="agenda-service">${a.servico_nome} · ${data} · ${a.barbeiro_nome}</div>
            </div>
            <span class="status-pill ${a.status}">${a.status}</span>
          </div>`;
      })
      .join("");
  } catch (_) {
    lista.innerHTML = `<p style="color:var(--muted);font-size:.82rem;">Erro ao carregar agendamentos.</p>`;
  }
}

// ─── Sidebar
function inicializarSidebar() {
  const btn = document.getElementById("btn-hamburger");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("sidebar-overlay");

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

  sidebar.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      if (window.innerWidth <= 900) {
        sidebar.classList.remove("is-open");
        overlay.classList.remove("is-open");
        btn.classList.remove("is-open");
      }
    });
  });
}

// ─── Logout
async function logout() {
  try {
    const res = await fetch("/auth/logout", { method: "POST" });
    const data = await res.json();
    window.location.href = data.redirect || "/auth/login";
  } catch (_) {
    window.location.href = "/auth/login";
  }
}
