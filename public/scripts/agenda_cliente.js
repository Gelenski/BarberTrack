const state = {
  barbeariaId: null,
  barbeiros: [],
  servicos: [],
  servicoSelecionado: null,
  barbeiroId: null,
  slotSelecionado: null,
};

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  state.barbeariaId = params.get("barbearia_id");

  if (!state.barbeariaId) {
    window.location.href = "/cliente/dashboard";
    return;
  }

  inicializarUsuario();
  inicializarSidebar();
  carregarBarbearia();
  carregarAgendaGeral();
  carregarBarbeiros();
  carregarServicos();

  document.getElementById("inp-data").addEventListener("change", onDataChange);
  document
    .getElementById("sel-barbeiro")
    .addEventListener("change", onBarbeiroChange);
  document
    .getElementById("btn-confirmar")
    .addEventListener("click", confirmarAgendamento);
  document
    .getElementById("btn-favoritar")
    .addEventListener("click", toggleFavoritar);
  document.getElementById("btn-logout").addEventListener("click", logout);

  const hoje = new Date().toISOString().split("T")[0];
  document.getElementById("inp-data").min = hoje;
  document.getElementById("inp-data").value = hoje;
});

function inicializarUsuario() {
  try {
    const u = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (u?.nome) {
      document.getElementById("nome-cliente").textContent = u.nome;
      document.getElementById("avatar-inicial").textContent =
        u.nome[0].toUpperCase();
    }
  } catch (error) {
    console.error(error);
  }
}

async function carregarBarbearia() {
  try {
    const res = await fetch(`/cliente/barbearia/${state.barbeariaId}`);
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || "Barbearia nao encontrada.");

    const { barbearia } = body;
    document.getElementById("barbearia-nome").textContent =
      barbearia.nome_fantasia;
    document.getElementById("barbearia-email").textContent =
      barbearia.email || "";
    document.getElementById("barbearia-tel").textContent =
      barbearia.telefone || "";
    document.title = `${barbearia.nome_fantasia} | BarberTrack`;

    const btnFav = document.getElementById("btn-favoritar");
    if (barbearia.favorita) {
      btnFav.textContent = "★ Favoritada";
      btnFav.classList.add("favorita");
      btnFav.dataset.isFav = "1";
    } else {
      btnFav.textContent = "☆ Favoritar";
      btnFav.classList.remove("favorita");
      btnFav.dataset.isFav = "0";
    }
  } catch (error) {
    console.error(error);
    document.getElementById("barbearia-nome").textContent =
      "Barbearia nao encontrada";
  }
}

async function toggleFavoritar() {
  const btn = document.getElementById("btn-favoritar");
  const isFav = btn.dataset.isFav === "1";
  const method = isFav ? "DELETE" : "POST";

  try {
    const res = await fetch(
      `/cliente/barbearias/favoritas/${state.barbeariaId}`,
      { method }
    );
    if (!res.ok) throw new Error();

    if (isFav) {
      btn.textContent = "☆ Favoritar";
      btn.classList.remove("favorita");
      btn.dataset.isFav = "0";
    } else {
      btn.textContent = "★ Favoritada";
      btn.classList.add("favorita");
      btn.dataset.isFav = "1";
    }
  } catch (error) {
    console.error(error);
  }
}

async function carregarAgendaGeral() {
  const lista = document.getElementById("agenda-geral-lista");
  const label = document.getElementById("agenda-data-label");
  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
  label.textContent = hoje;

  try {
    const res = await fetch(`/cliente/barbearia/${state.barbeariaId}`);
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || "Erro ao carregar agenda.");

    const { agendamentos } = body;

    if (!agendamentos.length) {
      lista.innerHTML =
        '<div style="text-align:center;padding:1.5rem;color:var(--muted);font-size:.82rem;">Nenhum agendamento nos proximos dias.</div>';
      return;
    }

    lista.innerHTML =
      '<div class="horarios-livres">' +
      agendamentos
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
          <div class="hl-item">
            <span class="hl-time">${hora}</span>
            <span style="flex:1;">${a.servico_nome} · ${data}</span>
            <span class="hl-barber">${a.barbeiro_nome}</span>
          </div>`;
        })
        .join("") +
      "</div>";
  } catch (error) {
    console.error(error);
    lista.innerHTML =
      '<div style="padding:1rem;color:var(--muted);font-size:.82rem;">Erro ao carregar agenda.</div>';
  }
}

async function carregarBarbeiros() {
  const sel = document.getElementById("sel-barbeiro");
  try {
    const res = await fetch(
      `/cliente/barbearia/${state.barbeariaId}/barbeiros`
    );
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || "Erro ao carregar barbeiros.");

    const { barbeiros } = body;
    state.barbeiros = barbeiros;

    sel.innerHTML =
      '<option value="">Selecione um barbeiro...</option>' +
      barbeiros
        .map((b) => `<option value="${b.id}">${b.nome}</option>`)
        .join("");
  } catch (error) {
    console.error(error);
    sel.innerHTML = '<option value="">Erro ao carregar barbeiros</option>';
  }
}

function onBarbeiroChange() {
  state.barbeiroId = document.getElementById("sel-barbeiro").value || null;
  state.slotSelecionado = null;
  atualizarSlots();
}

async function carregarServicos() {
  const container = document.getElementById("servico-cards");
  try {
    const res = await fetch(`/cliente/barbearia/${state.barbeariaId}/servicos`);
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || "Erro ao carregar servicos.");

    const { servicos } = body;
    state.servicos = servicos;

    if (!servicos.length) {
      container.innerHTML =
        '<p style="color:var(--muted);font-size:.82rem;grid-column:1/-1;">Nenhum servico cadastrado.</p>';
      return;
    }

    container.innerHTML = servicos
      .map(
        (s) => `
      <button
        class="servico-card"
        data-id="${s.id}"
        data-duracao="${s.duracao_min}"
        data-preco="${s.preco}"
        onclick="selecionarServico(${s.id})"
      >
        <div class="servico-card-nome">${s.nome}</div>
        <div class="servico-card-info">${s.duracao_min} min</div>
        <div class="servico-card-preco">R$ ${Number(s.preco).toFixed(2)}</div>
      </button>`
      )
      .join("");
  } catch (error) {
    console.error(error);
    container.innerHTML =
      '<p style="color:var(--muted);font-size:.82rem;grid-column:1/-1;">Erro ao carregar servicos.</p>';
  }
}

// eslint-disable-next-line no-unused-vars
function selecionarServico(id) {
  state.servicoSelecionado = state.servicos.find((s) => s.id === id) || null;
  state.slotSelecionado = null;

  document.querySelectorAll(".servico-card").forEach((card) => {
    card.classList.toggle("selected", parseInt(card.dataset.id, 10) === id);
  });

  atualizarSlots();
  atualizarResumo();
}

function onDataChange() {
  state.slotSelecionado = null;
  atualizarSlots();
}

async function atualizarSlots() {
  const section = document.getElementById("slots-section");
  const grid = document.getElementById("slots-grid");

  if (!state.barbeiroId || !state.servicoSelecionado) {
    section.classList.add("step-hidden");
    atualizarBotaoConfirmar();
    return;
  }

  const data = document.getElementById("inp-data").value;
  if (!data) {
    section.classList.add("step-hidden");
    return;
  }

  section.classList.remove("step-hidden");
  grid.innerHTML =
    '<div class="loading-spinner" style="grid-column:1/-1;">Buscando horarios...</div>';

  try {
    const res = await fetch(
      `/cliente/barbeiro/${state.barbeiroId}/slots?data=${data}&servico_id=${state.servicoSelecionado.id}`
    );
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || "Erro ao buscar horarios.");

    const { slots } = body;

    if (!slots.length) {
      grid.innerHTML =
        '<div class="slots-empty" style="grid-column:1/-1;">Nenhum horario disponivel nesta data.</div>';
      return;
    }

    grid.innerHTML = slots
      .map(
        (s) =>
          `<button class="slot-btn" onclick="selecionarSlot('${s}', this)">${s}</button>`
      )
      .join("");
  } catch (error) {
    console.error(error);
    grid.innerHTML =
      '<div class="slots-empty" style="grid-column:1/-1;">Erro ao buscar horarios.</div>';
  }
}

// eslint-disable-next-line no-unused-vars
function selecionarSlot(slot, btn) {
  state.slotSelecionado = slot;
  document
    .querySelectorAll(".slot-btn")
    .forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
  atualizarResumo();
  atualizarBotaoConfirmar();
}

function atualizarResumo() {
  const box = document.getElementById("confirm-box");

  if (!state.servicoSelecionado || !state.slotSelecionado) {
    box.classList.add("step-hidden");
    return;
  }

  const data = document.getElementById("inp-data").value;
  const barbeiroNome =
    document.getElementById("sel-barbeiro").selectedOptions[0]?.text || "—";
  const dt = new Date(`${data}T${state.slotSelecionado}:00`);
  const dtStr = dt.toLocaleString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  document.getElementById("conf-barbeiro").textContent = barbeiroNome;
  document.getElementById("conf-servico").textContent =
    `${state.servicoSelecionado.nome} (${state.servicoSelecionado.duracao_min} min)`;
  document.getElementById("conf-horario").textContent = dtStr;
  document.getElementById("conf-preco").textContent =
    `R$ ${Number(state.servicoSelecionado.preco).toFixed(2)}`;

  box.classList.remove("step-hidden");
}

function atualizarBotaoConfirmar() {
  const btn = document.getElementById("btn-confirmar");
  btn.disabled = !(
    state.barbeiroId &&
    state.servicoSelecionado &&
    state.slotSelecionado
  );
}

async function confirmarAgendamento() {
  const btn = document.getElementById("btn-confirmar");
  const statusEl = document.getElementById("form-status");
  statusEl.style.display = "none";

  if (!state.barbeiroId || !state.servicoSelecionado || !state.slotSelecionado)
    return;

  const data = document.getElementById("inp-data").value;
  const horario = `${data}T${state.slotSelecionado}:00`;

  btn.disabled = true;
  btn.textContent = "Confirmando...";

  try {
    const res = await fetch("/cliente/agendamento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        barbearia_id: parseInt(state.barbeariaId, 10),
        barbeiro_id: parseInt(state.barbeiroId, 10),
        servico_id: state.servicoSelecionado.id,
        horario,
      }),
    });

    const data_ = await res.json();

    if (!res.ok) {
      statusEl.textContent = data_.error || "Erro ao agendar.";
      statusEl.style.display = "block";
      btn.disabled = false;
      btn.textContent = "Confirmar Agendamento";
      return;
    }

    document.getElementById("main-grid").style.display = "none";
    const stepSucesso = document.getElementById("step-sucesso");
    stepSucesso.classList.remove("step-hidden");

    const barbeiroNome =
      document.getElementById("sel-barbeiro").selectedOptions[0]?.text;
    const dt = new Date(`${data}T${state.slotSelecionado}:00`);
    const dtStr = dt.toLocaleString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
    document.getElementById("sucesso-descricao").textContent =
      `${state.servicoSelecionado.nome} com ${barbeiroNome} — ${dtStr}`;
  } catch (error) {
    console.error(error);
    statusEl.textContent = "Erro de conexao. Tente novamente.";
    statusEl.style.display = "block";
    btn.disabled = false;
    btn.textContent = "Confirmar Agendamento";
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
