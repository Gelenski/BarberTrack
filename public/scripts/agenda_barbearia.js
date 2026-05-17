// ─── Init
document.addEventListener("DOMContentLoaded", () => {
  inicializarUsuario();
  inicializarSidebar();
  document.getElementById("btn-logout").addEventListener("click", logout);

  // Data padrão = hoje
  const hoje = new Date().toISOString().split("T")[0];
  document.getElementById("filtro-data").value = hoje;

  carregarAgendamentos();
});

// ─── Usuário
function inicializarUsuario() {
  try {
    const u = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (u?.nome) document.getElementById("nome-barbearia").textContent = u.nome;
  } catch (error) {
    console.error(error);
  }
}

// ─── Carregar agendamentos
async function carregarAgendamentos() {
  const data = document.getElementById("filtro-data").value;
  const barbeiroId = document.getElementById("filtro-barbeiro").value;

  mostrarLoading();

  try {
    const params = new URLSearchParams({ data });
    if (barbeiroId) params.set("barbeiro_id", barbeiroId);

    const res = await fetch(`/barbearia/agenda/agendamentos?${params}`);
    if (!res.ok) throw new Error();
    const { agendamentos, barbeiros } = await res.json();

    popularFiltro(barbeiros);
    renderTabela(agendamentos);
    renderMetricas(agendamentos);
  } catch (error) {
    console.error(error);
    mostrarErro();
  }
}

// ─── Filtro de barbeiros
function popularFiltro(barbeiros) {
  const sel = document.getElementById("filtro-barbeiro");
  const valorAtual = sel.value;
  sel.innerHTML =
    `<option value="">Todos os barbeiros</option>` +
    barbeiros.map((b) => `<option value="${b.id}">${b.nome}</option>`).join("");
  sel.value = valorAtual;
}

// ─── Tabela
function renderTabela(agendamentos) {
  const loading = document.getElementById("estado-loading");
  const vazio = document.getElementById("estado-vazio");
  const tabela = document.getElementById("tabela");
  const tbody = document.getElementById("tbody");

  loading.style.display = "none";

  if (!agendamentos.length) {
    vazio.style.display = "block";
    tabela.style.display = "none";
    return;
  }

  vazio.style.display = "none";
  tabela.style.display = "table";

  tbody.innerHTML = agendamentos
    .map((a) => {
      const dt = new Date(a.horario);
      const hora = dt.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `
      <tr>
        <td class="col-horario">${hora}</td>
        <td>
          <div>${a.cliente_nome}</div>
          ${a.cliente_telefone ? `<div style="font-size:.72rem;color:var(--muted);">${a.cliente_telefone}</div>` : ""}
        </td>
        <td>${a.barbeiro_nome}</td>
        <td>${a.servico_nome}</td>
        <td class="col-duracao">${a.duracao_min} min</td>
        <td class="col-preco">R$ ${Number(a.preco).toFixed(2)}</td>
        <td>
          <select
            class="status-select status-${a.status}"
            data-id="${a.id}"
            onchange="atualizarStatus(${a.id}, this)"
          >
            <option value="confirmado" ${a.status === "confirmado" ? "selected" : ""}>Confirmado</option>
            <option value="concluido"  ${a.status === "concluido" ? "selected" : ""}>Concluído</option>
            <option value="cancelado"  ${a.status === "cancelado" ? "selected" : ""}>Cancelado</option>
          </select>
        </td>
        <td class="col-obs" title="${a.observacao || ""}">${a.observacao || "—"}</td>
      </tr>`;
    })
    .join("");
}

// ─── Métricas
function renderMetricas(agendamentos) {
  const el = document.getElementById("metricas");
  if (!agendamentos.length) {
    el.style.display = "none";
    return;
  }

  el.style.display = "grid";
  document.getElementById("m-total").textContent = agendamentos.length;
  document.getElementById("m-confirmados").textContent = agendamentos.filter(
    (a) => a.status === "confirmado"
  ).length;
  document.getElementById("m-concluidos").textContent = agendamentos.filter(
    (a) => a.status === "concluido"
  ).length;
  document.getElementById("m-cancelados").textContent = agendamentos.filter(
    (a) => a.status === "cancelado"
  ).length;

  const receita = agendamentos
    .filter((a) => a.status !== "cancelado")
    .reduce((sum, a) => sum + Number(a.preco), 0);
  document.getElementById("m-receita").textContent =
    `R$ ${receita.toFixed(2).replace(".", ",")}`;
}

// ─── Atualizar status
// eslint-disable-next-line no-unused-vars
async function atualizarStatus(id, sel) {
  const novoStatus = sel.value;
  sel.className = `status-select status-${novoStatus}`;
  try {
    await fetch(`/barbearia/agendamento/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });
  } catch (error) {
    console.error(error);
  }
}

// ─── Estados de loading / erro
function mostrarLoading() {
  document.getElementById("estado-loading").style.display = "block";
  document.getElementById("estado-vazio").style.display = "none";
  document.getElementById("tabela").style.display = "none";
  document.getElementById("metricas").style.display = "none";
}

function mostrarErro() {
  document.getElementById("estado-loading").textContent =
    "Erro ao carregar agendamentos. Tente novamente.";
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
async function logout() {
  try {
    const res = await fetch("/auth/logout", { method: "POST" });
    const d = await res.json();
    window.location.href = d.redirect || "/auth/login";
  } catch (error) {
    console.error(error);
    window.location.href = "/auth/login";
  }
}
