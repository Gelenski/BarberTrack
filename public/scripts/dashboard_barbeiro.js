// ─── Init
document.addEventListener("DOMContentLoaded", () => {
  inicializarUsuario();
  mostrarData();
  carregarAgendaHoje();

  document.getElementById("btn-logout").addEventListener("click", logout);
  inicializarSidebar();
});

// ─── Usuário
function inicializarUsuario() {
  try {
    const u = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (u?.nome) {
      document.getElementById("nome-barbeiro").textContent = u.nome;
      document.getElementById("avatar-inicial").textContent = u.nome[0].toUpperCase();
    }
  } catch (_) {}
}

function mostrarData() {
  const opts = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  document.getElementById("data-atual").textContent =
    new Date().toLocaleDateString("pt-BR", opts);
}

// ─── Agenda de hoje
async function carregarAgendaHoje() {
  const lista = document.getElementById("agenda-list");
  const hoje = new Date().toISOString().split("T")[0];

  try {
    const res = await fetch(`/barbeiro/agenda/agendamentos?data=${hoje}`);
    if (!res.ok) throw new Error();
    const { agendamentos } = await res.json();

    atualizarMetricas(agendamentos);

    if (!agendamentos.length) {
      lista.innerHTML = `
        <div style="text-align:center;padding:2rem;color:var(--muted);font-size:.85rem;">
          Nenhum agendamento para hoje.
        </div>`;
      return;
    }

    lista.innerHTML = agendamentos.map((a) => {
      const hora = new Date(a.horario).toLocaleTimeString("pt-BR", {
        hour: "2-digit", minute: "2-digit",
      });
      const statusLabel = { confirmado: "Confirmado", concluido: "Concluído", cancelado: "Cancelado" };
      return `
        <div class="agenda-item">
          <span class="agenda-time">${hora}</span>
          <div class="agenda-divider"></div>
          <div class="agenda-info">
            <div class="agenda-client">${a.cliente_nome}</div>
            <div class="agenda-service">${a.servico_nome} · ${a.duracao_min} min
              ${a.cliente_telefone ? `· ${a.cliente_telefone}` : ""}
            </div>
          </div>
          <span class="status-pill ${a.status}">${statusLabel[a.status] ?? a.status}</span>
        </div>`;
    }).join("");
  } catch (_) {
    lista.innerHTML = `
      <div style="text-align:center;padding:1.5rem;color:var(--muted);font-size:.85rem;">
        Erro ao carregar agenda.
      </div>`;
  }
}

// ─── Métricas
function atualizarMetricas(agendamentos) {
  const agora = new Date();

  const confirmados = agendamentos.filter((a) => a.status === "confirmado");
  const receita = agendamentos
    .filter((a) => a.status !== "cancelado")
    .reduce((sum, a) => sum + Number(a.preco), 0);

  const proximo = agendamentos.find(
    (a) => new Date(a.horario) > agora && a.status === "confirmado"
  );

  document.getElementById("m-total").textContent = agendamentos.length;
  document.getElementById("m-total-info").textContent =
    agendamentos.length === 1 ? "atendimento hoje" : "atendimentos hoje";

  document.getElementById("m-confirmados").textContent = confirmados.length;

  document.getElementById("m-receita").textContent =
    `R$ ${receita.toFixed(2).replace(".", ",")}`;

  if (proximo) {
    const hora = new Date(proximo.horario).toLocaleTimeString("pt-BR", {
      hour: "2-digit", minute: "2-digit",
    });
    document.getElementById("m-proximo").textContent = hora;
    document.getElementById("m-proximo-info").textContent = proximo.cliente_nome;
  } else {
    document.getElementById("m-proximo").textContent = "--";
    document.getElementById("m-proximo-info").textContent = "Nenhum a seguir";
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
    const d = await res.json();
    window.location.href = d.redirect || "/auth/login";
  } catch (_) {
    window.location.href = "/auth/login";
  }
}