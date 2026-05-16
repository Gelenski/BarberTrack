const state = { clientes: [], servicos: [] };

document.addEventListener("DOMContentLoaded", () => {
  inicializarUsuario();
  inicializarSidebar();
  configurarLogout();
  configurarCampoHorario();
  configurarFormulario();
  carregarDadosFormulario();
});

function inicializarUsuario() {
  try {
    const u = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (u?.nome) {
      document.getElementById("nome-barbeiro").textContent = u.nome;
      const avatar = document.getElementById("avatar-inicial");
      if (avatar) avatar.textContent = u.nome[0].toUpperCase();
    }
  } catch { /* intencional */ }
}

async function carregarDadosFormulario() {
  const status        = document.getElementById("agendamento-status");
  const clienteSelect = document.getElementById("cliente_id");
  const servicoSelect = document.getElementById("servico_id");

  try {
    const [clientesRes, servicosRes] = await Promise.all([
      fetch("/barbeiro/clientes"),
      fetch("/barbeiro/servicos"),
    ]);

    const clientesBody = await clientesRes.json();
    const servicosBody = await servicosRes.json();

    if (!clientesRes.ok) throw new Error(clientesBody.error || "Erro ao carregar clientes.");
    if (!servicosRes.ok) throw new Error(servicosBody.error || "Erro ao carregar serviços.");

    state.clientes = clientesBody.clientes || [];
    state.servicos = servicosBody.servicos || [];

    clienteSelect.innerHTML = [
      '<option value="">Selecione um cliente</option>',
      ...state.clientes.map(
        (c) => `<option value="${c.id}">${c.nome} ${c.sobrenome}${c.telefone ? ` · ${c.telefone}` : ""}</option>`
      ),
    ].join("");

    servicoSelect.innerHTML = [
      '<option value="">Selecione um serviço</option>',
      ...state.servicos.map(
        (s) => `<option value="${s.id}">${s.nome} · ${s.duracao_min} min · R$ ${Number(s.preco).toFixed(2)}</option>`
      ),
    ].join("");

    if (!state.clientes.length) {
      alternarFormularioDisponivel(false);
      status.style.display = "block";
      status.textContent = "Nenhum cliente vinculado a esta barbearia.";
      status.className = "bt-form-status is-info";
      return;
    }

    alternarFormularioDisponivel(true);
    status.style.display = state.servicos.length ? "none" : "block";
    if (!state.servicos.length) {
      status.textContent = "Nenhum serviço ativo. Você pode criar um novo no agendamento.";
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
  document.querySelectorAll('input[name="tipo_servico"]').forEach((radio) => {
    radio.addEventListener("change", atualizarModoServico);
  });
  document.getElementById("agendamento-form").addEventListener("submit", enviarAgendamento);
  atualizarModoServico();
}

function atualizarModoServico() {
  const modo            = document.querySelector('input[name="tipo_servico"]:checked')?.value;
  const grupoExistente  = document.getElementById("servico-existente-group");
  const grupoNovo       = document.getElementById("servico-novo-group");
  const servicoId       = document.getElementById("servico_id");
  const nome            = document.getElementById("servico_nome");
  const duracao         = document.getElementById("servico_duracao_min");
  const preco           = document.getElementById("servico_preco");
  const usandoNovo      = modo === "novo";

  grupoExistente.hidden = usandoNovo;
  grupoNovo.hidden      = !usandoNovo;
  servicoId.required    = !usandoNovo;
  nome.required         = usandoNovo;
  duracao.required      = usandoNovo;
  preco.required        = usandoNovo;
}

function configurarCampoHorario() {
  const campo = document.getElementById("horario");
  const agora = new Date();
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
  campo.min = agora.toISOString().slice(0, 16);
}

function alternarFormularioDisponivel(disponivel) {
  document
    .querySelectorAll("#agendamento-form input, #agendamento-form select, #agendamento-form button")
    .forEach((el) => { el.disabled = !disponivel; });
}

async function enviarAgendamento(event) {
  event.preventDefault();

  const btn        = document.getElementById("btn-agendar");
  const status     = document.getElementById("agendamento-status");
  const modo       = document.querySelector('input[name="tipo_servico"]:checked')?.value;
  const usandoNovo = modo === "novo";

  const payload = {
    cliente_id: Number(document.getElementById("cliente_id").value),
    horario: formatarHorarioParaApi(document.getElementById("horario").value),
    observacao: document.getElementById("observacao").value.trim() || undefined,
  };

  if (usandoNovo) {
    payload.servico_nome        = document.getElementById("servico_nome").value.trim();
    payload.servico_duracao_min = Number(document.getElementById("servico_duracao_min").value);
    payload.servico_preco       = Number(document.getElementById("servico_preco").value);
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
    const res  = await fetch("/agendamento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json();

    if (!res.ok) throw new Error(body.erro || body.error || "Não foi possível agendar.");

    status.textContent = body.mensagem || "Agendamento criado com sucesso.";
    status.className = "bt-form-status is-success";

    if (body.servico_criado) adicionarServicoCriadoAoSelect(body.servico_id, payload);
    formResetAposSucesso();
  } catch (error) {
    status.textContent = error.message || "Erro ao criar agendamento.";
    status.className = "bt-form-status is-error";
  } finally {
    btn.disabled = false;
    btn.textContent = "Confirmar Agendamento";
  }
}

function formResetAposSucesso() {
  document.getElementById("agendamento-form").reset();
  document.querySelector('input[name="tipo_servico"][value="existente"]').checked = true;
  atualizarModoServico();
}

function adicionarServicoCriadoAoSelect(servicoId, payload) {
  if (!servicoId || !payload?.servico_nome) return;
  if (state.servicos.some((s) => s.id === servicoId)) return;

  state.servicos.push({
    id: servicoId,
    nome: payload.servico_nome,
    duracao_min: payload.servico_duracao_min,
    preco: payload.servico_preco,
  });
  state.servicos.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const sel = document.getElementById("servico_id");
  sel.innerHTML = [
    '<option value="">Selecione um serviço</option>',
    ...state.servicos.map(
      (s) => `<option value="${s.id}">${s.nome} · ${s.duracao_min} min · R$ ${Number(s.preco).toFixed(2)}</option>`
    ),
  ].join("");
}

function formatarHorarioParaApi(valor) {
  if (!valor) return "";
  return `${valor}:00`.replace("T", " ");
}

function inicializarSidebar() {
  const btn     = document.getElementById("btn-hamburger");
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

function configurarLogout() {
  document.getElementById("btn-logout").addEventListener("click", async () => {
    const btn = document.getElementById("btn-logout");
    btn.disabled = true;
    try {
      const res  = await fetch("/auth/logout", { method: "POST" });
      const data = await res.json();
      window.location.href = data.redirect || "/auth/login";
    } catch {
      window.location.href = "/auth/login";
    }
  });
}