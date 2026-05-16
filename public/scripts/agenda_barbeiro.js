// ─── Estado
const state = {
  view: "semana", // semana | dia | mes
  dataReferencia: new Date(),
  agendamentos: [],
};

const STATUS_LABEL = {
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

// ─── Init
document.addEventListener("DOMContentLoaded", () => {
  inicializarUsuario();
  inicializarSidebar();
  configurarLogout();
  configurarControles();
  renderizar();
});

// ─── Usuário
function inicializarUsuario() {
  try {
    const u = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (u?.nome) {
      document.getElementById("nome-barbeiro").textContent = u.nome;
      const avatar = document.getElementById("avatar-inicial");
      if (avatar) avatar.textContent = u.nome[0].toUpperCase();
    }
  } catch {
    /* intencional */
  }
}

// ─── Controles de navegação e view
function configurarControles() {
  document.getElementById("btn-anterior").addEventListener("click", () => navegar(-1));
  document.getElementById("btn-proximo").addEventListener("click", () => navegar(1));
  document.getElementById("btn-hoje").addEventListener("click", () => {
    state.dataReferencia = new Date();
    renderizar();
  });

  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".view-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.view = btn.dataset.view;
      renderizar();
    });
  });
}

function navegar(direcao) {
  const d = new Date(state.dataReferencia);
  if (state.view === "dia") d.setDate(d.getDate() + direcao);
  else if (state.view === "semana") d.setDate(d.getDate() + direcao * 7);
  else d.setMonth(d.getMonth() + direcao);
  state.dataReferencia = d;
  renderizar();
}

// ─── Renderizar (busca + exibe)
async function renderizar() {
  const { inicio, fim } = calcularIntervalo();
  atualizarPeriodoLabel(inicio, fim);

  document.getElementById("view-semana").style.display = state.view !== "mes" ? "block" : "none";
  document.getElementById("view-mes").style.display = state.view === "mes" ? "block" : "none";

  if (state.view !== "mes") {
    document.getElementById("semana-container").innerHTML =
      `<div class="agenda-loading">Carregando...</div>`;
  }

  try {
    const params = new URLSearchParams({
      data_inicio: formatarData(inicio),
      data_fim: formatarData(fim),
    });

    const res = await fetch(`/barbeiro/agenda/agendamentos?${params}`);
    const corpo = await res.json();

    if (!res.ok) throw new Error(corpo.error || "Erro ao carregar.");

    state.agendamentos = corpo.agendamentos || [];

    if (state.view === "mes") renderizarMes();
    else renderizarSemanaOuDia(inicio, fim);
  } catch (error) {
    document.getElementById("semana-container").innerHTML = `
      <div class="agenda-loading" style="color:var(--error);">
        ${error.message || "Erro ao carregar agendamentos."}
      </div>`;
  }
}

// ─── Visualização Semana / Dia
function renderizarSemanaOuDia(inicio, fim) {
  const container = document.getElementById("semana-container");
  const dias = [];
  const cursor = new Date(inicio);
  const hoje = formatarData(new Date());

  while (cursor <= fim) {
    dias.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  container.innerHTML = dias
    .map((dia) => {
      const chave = formatarData(dia);
      const agsDia = state.agendamentos.filter(
        (a) => formatarData(new Date(a.horario)) === chave
      );
      const isHoje = chave === hoje;
      const tituloFormatado = dia.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });

      return `
        <div class="dia-bloco">
          <div class="dia-bloco-header">
            <span class="dia-bloco-titulo ${isHoje ? "hoje" : ""}">
              ${isHoje ? "Hoje — " : ""}${tituloFormatado}
            </span>
            <span class="dia-bloco-count">${agsDia.length} agendamento${agsDia.length !== 1 ? "s" : ""}</span>
          </div>
          ${agsDia.length
            ? `<div class="agenda-list">${agsDia.map(renderizarItem).join("")}</div>`
            : `<div class="dia-vazio">Nenhum agendamento neste dia.</div>`
          }
        </div>`;
    })
    .join("");
}

// ─── Visualização Mês
function renderizarMes() {
  const body = document.getElementById("calendario-body");
  const ano = state.dataReferencia.getFullYear();
  const mes = state.dataReferencia.getMonth();
  const hoje = formatarData(new Date());

  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const inicioPadding = primeiroDia.getDay();

  const dias = [];

  for (let i = inicioPadding - 1; i >= 0; i--) {
    dias.push({ data: new Date(ano, mes, -i), outroMes: true });
  }

  for (let d = 1; d <= ultimoDia.getDate(); d++) {
    dias.push({ data: new Date(ano, mes, d), outroMes: false });
  }

  const restante = 7 - (dias.length % 7);
  if (restante < 7) {
    for (let i = 1; i <= restante; i++) {
      dias.push({ data: new Date(ano, mes + 1, i), outroMes: true });
    }
  }

  body.innerHTML = dias
    .map(({ data, outroMes }) => {
      const chave = formatarData(data);
      const agsDia = state.agendamentos.filter(
        (a) => formatarData(new Date(a.horario)) === chave
      );
      const isHoje = chave === hoje;
      const visiveis = agsDia.slice(0, 2);
      const extras = agsDia.length - visiveis.length;
      const tituloModal = data.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });

      return `
        <div
          class="cal-dia ${outroMes ? "outro-mes" : ""} ${isHoje ? "hoje" : ""}"
          onclick="abrirModalDia('${chave}', '${tituloModal}')"
        >
          <div class="cal-dia-numero">${data.getDate()}</div>
          ${visiveis.map((a) => `
            <div class="cal-evento ${a.status}">
              ${new Date(a.horario).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} ${a.cliente_nome.split(" ")[0]}
            </div>`).join("")}
          ${extras > 0 ? `<div class="cal-mais">+${extras} mais</div>` : ""}
        </div>`;
    })
    .join("");
}

// ─── Modal do dia
// eslint-disable-next-line no-unused-vars
function abrirModalDia(chave, titulo) {
  const modal = document.getElementById("modal-dia");
  const lista = document.getElementById("modal-lista");
  const tituloEl = document.getElementById("modal-titulo");

  const agsDia = state.agendamentos.filter(
    (a) => formatarData(new Date(a.horario)) === chave
  );

  tituloEl.textContent = titulo;
  lista.innerHTML = agsDia.length
    ? agsDia.map(renderizarItem).join("")
    : `<div class="dia-vazio">Nenhum agendamento neste dia.</div>`;

  modal.style.display = "flex";
}

document.getElementById("btn-fechar-modal").addEventListener("click", () => {
  document.getElementById("modal-dia").style.display = "none";
});

document.getElementById("modal-dia").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) e.currentTarget.style.display = "none";
});

// ─── Renderizar item
function renderizarItem(a) {
  const hora = new Date(a.horario).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `
    <div class="agenda-item">
      <span class="agenda-time">${hora}</span>
      <div class="agenda-divider"></div>
      <div class="agenda-info">
        <div class="agenda-client">${a.cliente_nome}</div>
        <div class="agenda-service">${a.servico_nome} · ${a.duracao_min} min · R$ ${Number(a.preco).toFixed(2)}</div>
      </div>
      <span class="status-pill ${a.status}">${STATUS_LABEL[a.status] ?? a.status}</span>
    </div>`;
}

// ─── Período label
function atualizarPeriodoLabel(inicio, fim) {
  const el = document.getElementById("periodo-label");
  if (state.view === "dia") {
    el.textContent = inicio.toLocaleDateString("pt-BR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } else if (state.view === "semana") {
    const ini = inicio.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
    const f = fim.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
    el.textContent = `${ini} – ${f}`;
  } else {
    el.textContent = state.dataReferencia.toLocaleDateString("pt-BR", {
      month: "long", year: "numeric",
    });
  }
}

// ─── Calcular intervalo
function calcularIntervalo() {
  const d = new Date(state.dataReferencia);

  if (state.view === "dia") return { inicio: new Date(d), fim: new Date(d) };

  if (state.view === "semana") {
    const inicio = new Date(d);
    inicio.setDate(d.getDate() - d.getDay());
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    return { inicio, fim };
  }

  const inicio = new Date(d.getFullYear(), d.getMonth(), 1);
  const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { inicio, fim };
}

// ─── Helper
function formatarData(d) {
  return d.toISOString().split("T")[0];
}

// ─── Sidebar
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