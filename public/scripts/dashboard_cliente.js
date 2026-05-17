// ─── Data atual
const dataAtualEl = document.getElementById("data-atual");
if (dataAtualEl) {
  dataAtualEl.textContent = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Nome do cliente via localStorage
function carregarDadosCliente() {
  try {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (usuario?.nome) {
      const nomeEl = document.getElementById("nome-cliente");
      const avatarEl = document.getElementById("avatar-cliente");
      if (nomeEl) nomeEl.textContent = usuario.nome;
      if (avatarEl) avatarEl.textContent = usuario.nome[0].toUpperCase();
    }
  } catch {
    /* intencional */
  }
}

// ─── Agendamentos (próximos + histórico) — uma única chamada
async function carregarAgendamentos() {
  const listaProximos = document.getElementById("lista-proximos");
  const listaHistorico = document.getElementById("lista-historico");

  try {
    const res = await fetch("/cliente/agendamentos");
    if (!res.ok) throw new Error();
    const { agendamentos } = await res.json();

    const agora = new Date();

    const proximos = agendamentos.filter(
      (a) => new Date(a.horario) >= agora && a.status !== "cancelado"
    );
    const historico = agendamentos.filter(
      (a) => new Date(a.horario) < agora || a.status === "cancelado"
    );

    // Próximos agendamentos
    if (listaProximos) {
      if (!proximos.length) {
        listaProximos.innerHTML = `
          <div class="barber-empty">
            <span class="empty-icon">📅</span>
            Nenhum agendamento próximo.<br>
            <a href="/cliente/agenda">Agendar agora →</a>
          </div>`;
        atualizarMetricaProximo(null);
      } else {
        listaProximos.innerHTML = proximos
          .slice(0, 5)
          .map(renderizarAgendamento)
          .join("");
        atualizarMetricaProximo(proximos[0]);
      }
    }

    // Histórico recente
    if (listaHistorico) {
      if (!historico.length) {
        listaHistorico.innerHTML = `
          <div class="barber-empty">
            <span class="empty-icon">📋</span>
            Nenhum histórico disponível.
          </div>`;
      } else {
        listaHistorico.innerHTML = historico
          .slice(0, 3)
          .map(renderizarAgendamento)
          .join("");
      }
    }

    atualizarMetricasMes(agendamentos);
  } catch {
    if (listaProximos)
      listaProximos.innerHTML = `<div class="barber-empty">Erro ao carregar agendamentos.</div>`;
    if (listaHistorico)
      listaHistorico.innerHTML = `<div class="barber-empty">Erro ao carregar histórico.</div>`;
  }
}

// ─── Barbearias vinculadas
async function carregarBarbearias() {
  const lista = document.getElementById("barbearias-list");
  const countEl = document.getElementById("barbearias-count");
  if (!lista) return;

  try {
    const res = await fetch("/cliente/barbearias/vinculadas");
    if (!res.ok) throw new Error();
    const { barbearias } = await res.json();

    if (countEl) countEl.textContent = barbearias.length;

    if (!barbearias.length) {
      lista.innerHTML = `
        <div class="barber-empty">
          <span class="empty-icon">✂</span>
          Nenhuma barbearia disponível.
        </div>`;
      return;
    }

    lista.innerHTML = barbearias
      .map(
        (b) => `
      <div class="barber-item">
        <div class="barber-avatar">${b.nome_fantasia[0].toUpperCase()}</div>
        <div class="barber-info">
          <div class="barber-name">${b.nome_fantasia}</div>
          <div class="barber-role">${b.email || b.telefone || "Barbearia"}</div>
        </div>
        <a href="/cliente/agenda?barbearia_id=${b.id}" style="font-size:.75rem;color:var(--gold);text-decoration:none;">Agendar</a>
      </div>`
      )
      .join("");
  } catch {
    if (lista)
      lista.innerHTML = `<div class="barber-empty">Erro ao carregar barbearias.</div>`;
  }
}

// ─── Helpers
function renderizarAgendamento(ag) {
  const data = new Date(ag.horario);
  const hora = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dataFormatada = data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
  const statusLabel = {
    confirmado: "Confirmado",
    concluido: "Concluído",
    cancelado: "Cancelado",
  };

  return `
    <div class="agenda-item">
      <span class="agenda-time">${hora}</span>
      <div class="agenda-divider"></div>
      <div class="agenda-info">
        <div class="agenda-client">${ag.barbearia_nome}</div>
        <div class="agenda-service">${ag.servico_nome} · ${ag.duracao_min} min · ${dataFormatada}</div>
      </div>
      <div class="agenda-barber">${ag.barbeiro_nome.split(" ")[0]}</div>
      <span class="status-pill ${ag.status}">${statusLabel[ag.status] ?? ag.status}</span>
    </div>`;
}

function atualizarMetricaProximo(ag) {
  const valorEl = document.getElementById("proximo-agendamento");
  const infoEl = document.getElementById("proximo-agendamento-info");

  if (!ag) {
    if (valorEl) valorEl.textContent = "--";
    if (infoEl) infoEl.textContent = "Nenhum agendamento";
    return;
  }

  const data = new Date(ag.horario);
  const hora = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dataFormatada = data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });

  if (valorEl) valorEl.textContent = hora;
  if (infoEl) infoEl.textContent = `${dataFormatada} · ${ag.servico_nome}`;
}

function atualizarMetricasMes(agendamentos) {
  const agora = new Date();
  const agMes = agendamentos.filter((ag) => {
    const d = new Date(ag.horario);
    return (
      d.getMonth() === agora.getMonth() &&
      d.getFullYear() === agora.getFullYear()
    );
  });

  const totalGasto = agMes.reduce((acc, ag) => acc + Number(ag.preco || 0), 0);

  const cortesEl = document.getElementById("cortes-mes");
  const gastoEl = document.getElementById("gasto-mes");
  const cortesInfoEl = document.getElementById("cortes-mes-info");

  if (cortesEl) cortesEl.textContent = agMes.length;
  if (gastoEl)
    gastoEl.textContent = `R$ ${totalGasto.toFixed(2).replace(".", ",")}`;
  if (cortesInfoEl) cortesInfoEl.textContent = "cortes realizados";
}

// ─── Logout
document.getElementById("btn-logout")?.addEventListener("click", async () => {
  const btn = document.getElementById("btn-logout");
  if (btn) btn.disabled = true;
  try {
    const res = await fetch("/auth/logout", { method: "POST" });
    const data = await res.json();
    window.location.href = data.redirect || "/auth/login";
  } catch {
    window.location.href = "/auth/login";
  }
});

// ─── Hamburger
const btnHamburger = document.getElementById("btn-hamburger");
const sidebar = document.querySelector(".sidebar");
const overlay = document.getElementById("sidebar-overlay");

btnHamburger?.addEventListener("click", () => {
  btnHamburger.classList.toggle("is-open");
  sidebar.classList.toggle("is-open");
  overlay.classList.toggle("is-open");
});

overlay?.addEventListener("click", () => {
  btnHamburger.classList.remove("is-open");
  sidebar.classList.remove("is-open");
  overlay.classList.remove("is-open");
});

// ─── Init
carregarDadosCliente();
carregarAgendamentos();
carregarBarbearias();
