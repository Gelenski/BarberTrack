const state = {
  clientes: [],
  servicos: [],
};

// ─── Init
document.addEventListener("DOMContentLoaded", () => {
  inicializarUsuario();
  mostrarData();
  inicializarSidebar();
  configurarCampoHorario();
  configurarFormulario();
  configurarLogout();

  carregarAgendamentosHoje();
  carregarDadosFormulario();
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

// ─── Data
function mostrarData() {
  const el = document.getElementById("data-atual");
  if (!el) return;
  el.textContent = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Métricas
function atualizarMetricas(agendamentos) {
  const total = agendamentos.length;
  const confirmados = agendamentos.filter(
    (a) => a.status === "confirmado"
  ).length;
  const receita = agendamentos
    .filter((a) => a.status !== "cancelado")
    .reduce((sum, a) => sum + Number(a.preco || 0), 0);

  document.getElementById("m-total").textContent = total;
  document.getElementById("m-total-info").textContent =
    total === 1 ? "1 atendimento hoje" : `${total} atendimentos hoje`;
  document.getElementById("m-confirmados").textContent = confirmados;
  document.getElementById("m-receita").textContent =
    `R$ ${receita.toFixed(2).replace(".", ",")}`;

  const agora = new Date();
  const proximo = agendamentos
    .filter((a) => a.status === "confirmado" && new Date(a.horario) >= agora)
    .sort((a, b) => new Date(a.horario) - new Date(b.horario))[0];

  if (proximo) {
    const hora = new Date(proximo.horario).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    document.getElementById("m-proximo").textContent = hora;
    document.getElementById("m-proximo-info").textContent =
      proximo.cliente_nome || "—";
  } else {
    document.getElementById("m-proximo").textContent = "—";
    document.getElementById("m-proximo-info").textContent = "Nenhum próximo";
  }
}

// ─── Agenda do dia
async function carregarAgendamentosHoje() {
  const status = document.getElementById("agenda-status");
  const container = document.getElementById("agenda-container");

  try {
    const hoje = new Date().toISOString().split("T")[0];
    const resposta = await fetch(`/barbeiro/agenda/agendamentos?data=${hoje}`);
    const corpo = await resposta.json();

    if (!resposta.ok) {
      throw new Error(corpo.error || "Não foi possível carregar agenda.");
    }

    const agendamentos = corpo.agendamentos || [];

    atualizarMetricas(agendamentos);

    if (!agendamentos.length) {
      status.style.display = "block";
      status.textContent = "Nenhum agendamento para hoje.";
      status.className = "bt-form-status is-info";
      container.innerHTML = "";
      return;
    }

    status.style.display = "none";

    container.innerHTML = agendamentos
      .map((a) => {
        const hora = new Date(a.horario).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        return `
          <div class="bt-list-row">
            <div>
              <div class="bt-list-title">${a.cliente_nome}</div>
              <div class="bt-list-meta">${a.servico_nome} · ${a.duracao_min} min</div>
            </div>
            <div class="bt-list-meta is-gold">${hora}</div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    status.style.display = "block";
    status.textContent = error.message || "Erro ao carregar agenda.";
    status.className = "bt-form-status is-error";
    container.innerHTML = "";
  }
}

// ─── Formulário de agendamento
async function carregarDadosFormulario() {
  const status = document.getElementById("agendamento-status");
  const clienteSelect = document.getElementById("cliente_id");
  const servicoSelect = document.getElementById("servico_id");

  try {
    const [clientesRes, servicosRes] = await Promise.all([
      fetch("/barbeiro/clientes"),
      fetch("/barbeiro/servicos"),
    ]);

    const clientesBody = await clientesRes.json();
    const servicosBody = await servicosRes.json();

    if (!clientesRes.ok)
      throw new Error(clientesBody.error || "Erro ao carregar clientes.");
    if (!servicosRes.ok)
      throw new Error(servicosBody.error || "Erro ao carregar serviços.");

    state.clientes = clientesBody.clientes || [];
    state.servicos = servicosBody.servicos || [];

    clienteSelect.innerHTML = [
      '<option value="">Selecione um cliente</option>',
      ...state.clientes.map(
        (c) =>
          `<option value="${c.id}">${c.nome} ${c.sobrenome}${c.telefone ? ` · ${c.telefone}` : ""}</option>`
      ),
    ].join("");

    servicoSelect.innerHTML = [
      '<option value="">Selecione um serviço</option>',
      ...state.servicos.map(
        (s) =>
          `<option value="${s.id}">${s.nome} · ${s.duracao_min} min · R$ ${Number(s.preco).toFixed(2)}</option>`
      ),
    ].join("");

    if (!state.clientes.length) {
      alternarFormularioDisponivel(false);
      status.style.display = "block";
      status.textContent =
        "Nenhum cliente vinculado a esta barbearia. Cadastre ou vincule um cliente antes de agendar.";
      status.className = "bt-form-status is-info";
      return;
    }

    alternarFormularioDisponivel(true);
    status.style.display = state.servicos.length ? "none" : "block";
    if (!state.servicos.length) {
      status.textContent =
        "Nenhum serviço ativo encontrado. Você ainda pode criar um serviço novo no agendamento.";
      status.className = "bt-form-status is-info";
    }
  } catch (error) {
    alternarFormularioDisponivel(false);
    status.style.display = "block";
    status.textContent = error.message || "Erro ao carregar o formulário.";
    status.className = "bt-form-status is-error";
  }
}

function configurarFormulario() {
  const form = document.getElementById("agendamento-form");
  document.querySelectorAll('input[name="tipo_servico"]').forEach((radio) => {
    radio.addEventListener("change", atualizarModoServico);
  });
  form.addEventListener("submit", enviarAgendamento);
  atualizarModoServico();
}

function atualizarModoServico() {
  const modo = document.querySelector(
    'input[name="tipo_servico"]:checked'
  )?.value;
  const grupoExistente = document.getElementById("servico-existente-group");
  const grupoNovo = document.getElementById("servico-novo-group");
  const servicoId = document.getElementById("servico_id");
  const nome = document.getElementById("servico_nome");
  const duracao = document.getElementById("servico_duracao_min");
  const preco = document.getElementById("servico_preco");

  const usandoNovo = modo === "novo";

  grupoExistente.hidden = usandoNovo;
  grupoNovo.hidden = !usandoNovo;

  servicoId.required = !usandoNovo;
  nome.required = usandoNovo;
  duracao.required = usandoNovo;
  preco.required = usandoNovo;
}

function configurarCampoHorario() {
  const campo = document.getElementById("horario");
  const agora = new Date();
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
  campo.min = agora.toISOString().slice(0, 16);
}

function alternarFormularioDisponivel(disponivel) {
  document
    .querySelectorAll(
      "#agendamento-form input, #agendamento-form select, #agendamento-form button"
    )
    .forEach((el) => {
      if (el.id === "btn-logout") return;
      el.disabled = !disponivel;
    });
}

async function enviarAgendamento(event) {
  event.preventDefault();

  const btn = document.getElementById("btn-agendar");
  const status = document.getElementById("agendamento-status");
  const modo = document.querySelector(
    'input[name="tipo_servico"]:checked'
  )?.value;
  const usandoNovo = modo === "novo";

  const payload = {
    cliente_id: Number(document.getElementById("cliente_id").value),
    horario: formatarHorarioParaApi(document.getElementById("horario").value),
    observacao: document.getElementById("observacao").value.trim() || undefined,
  };

  if (usandoNovo) {
    payload.servico_nome = document.getElementById("servico_nome").value.trim();
    payload.servico_duracao_min = Number(
      document.getElementById("servico_duracao_min").value
    );
    payload.servico_preco = Number(
      document.getElementById("servico_preco").value
    );
  } else {
    payload.servico_id = Number(document.getElementById("servico_id").value);
  }

  if (!payload.cliente_id || !payload.horario) {
    status.style.display = "block";
    status.textContent = "Selecione um cliente e informe um horário válido.";
    status.className = "bt-form-status is-error";
    return;
  }

  if (!usandoNovo && !payload.servico_id) {
    status.style.display = "block";
    status.textContent = "Selecione um serviço existente para continuar.";
    status.className = "bt-form-status is-error";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Agendando...";
  status.style.display = "block";
  status.textContent = "Salvando agendamento...";
  status.className = "bt-form-status is-info";

  try {
    const response = await fetch("/agendamento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.erro || body.error || "Não foi possível agendar.");
    }

    const tipoServico = body.servico_criado
      ? "Serviço criado e vinculado ao agendamento."
      : body.servico_reutilizado
        ? "Serviço existente reaproveitado automaticamente."
        : "Serviço existente utilizado no agendamento.";

    status.textContent = `${body.mensagem || "Agendamento criado com sucesso."} ${tipoServico}`;
    status.className = "bt-form-status is-success";

    if (body.servico_criado) {
      adicionarServicoCriadoAoSelect(body.servico_id, payload);
    }

    formResetAposSucesso();
    carregarAgendamentosHoje();
  } catch (error) {
    status.textContent = error.message || "Erro ao criar agendamento.";
    status.className = "bt-form-status is-error";
  } finally {
    btn.disabled = false;
    btn.textContent = "Confirmar agendamento";
  }
}

function formResetAposSucesso() {
  document.getElementById("agendamento-form").reset();
  document.querySelector(
    'input[name="tipo_servico"][value="existente"]'
  ).checked = true;
  atualizarModoServico();
}

function adicionarServicoCriadoAoSelect(servicoId, payload) {
  if (!servicoId || !payload?.servico_nome) return;

  const jaExiste = state.servicos.some((s) => s.id === servicoId);
  if (jaExiste) return;

  const novoServico = {
    id: servicoId,
    nome: payload.servico_nome,
    duracao_min: payload.servico_duracao_min,
    preco: payload.servico_preco,
  };

  state.servicos.push(novoServico);
  state.servicos.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const sel = document.getElementById("servico_id");
  sel.innerHTML = [
    '<option value="">Selecione um serviço</option>',
    ...state.servicos.map(
      (s) =>
        `<option value="${s.id}">${s.nome} · ${s.duracao_min} min · R$ ${Number(s.preco).toFixed(2)}</option>`
    ),
  ].join("");
}

function formatarHorarioParaApi(valor) {
  if (!valor) return "";
  return `${valor}:00`.replace("T", " ");
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
