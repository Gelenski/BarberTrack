const DIAS = [
  "Domingo",
  "Segunda",
  "Terca",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sabado",
];

const state = {
  clientes: [],
  servicos: [],
};

document.addEventListener("DOMContentLoaded", () => {
  configurarCampoHorario();
  configurarFormulario();
  configurarLogout();
  carregarDashboard();
});

async function carregarDashboard() {
  await Promise.all([carregarHorarios(), carregarDadosFormulario()]);
}

async function carregarHorarios() {
  const status = document.getElementById("horarios-status");
  const container = document.getElementById("horarios-container");

  try {
    const hoje = new Date().toISOString().split("T")[0];

    const res = await fetch(`/barbeiro/agenda/agendamentos?data=${hoje}`);

    if (!res.ok) {
      throw new Error("Nao foi possivel carregar os horarios.");
    }

    const body = await res.json();
    const agendamentos = body.agendamentos || [];

    atualizarMetricas?.(agendamentos);

    if (!agendamentos.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:2rem;color:var(--muted);font-size:.85rem;">
          Nenhum agendamento para hoje.
        </div>
      `;
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
          <div class="agenda-item">
            <span class="agenda-time">${hora}</span>

            <div class="agenda-divider"></div>

            <div class="agenda-info">
              <div class="agenda-client">
                ${a.cliente_nome}
              </div>

              <div class="agenda-service">
                ${a.servico_nome} · ${a.duracao_min} min
                ${a.cliente_telefone ? `· ${a.cliente_telefone}` : ""}
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    status.style.display = "block";
    status.textContent =
      error.message || "Erro ao carregar horarios.";

    status.className = "bt-form-status is-error";

    container.innerHTML = "";
  }
}

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

    if (!clientesRes.ok) {
      throw new Error(
        clientesBody.error || "Nao foi possivel carregar os clientes."
      );
    }

    if (!servicosRes.ok) {
      throw new Error(
        servicosBody.error || "Nao foi possivel carregar os servicos."
      );
    }

    state.clientes = clientesBody.clientes || [];
    state.servicos = servicosBody.servicos || [];

    clienteSelect.innerHTML = [
      '<option value="">Selecione um cliente</option>',
      ...state.clientes.map(
        (cliente) =>
          `<option value="${cliente.id}">${cliente.nome} ${cliente.sobrenome}${cliente.telefone ? ` · ${cliente.telefone}` : ""}</option>`
      ),
    ].join("");

    servicoSelect.innerHTML = [
      '<option value="">Selecione um serviço</option>',
      ...state.servicos.map(
        (servico) =>
          `<option value="${servico.id}">${servico.nome} · ${servico.duracao_min} min · R$ ${Number(servico.preco).toFixed(2)}</option>`
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
        "Nenhum servico ativo encontrado. Voce ainda pode criar um servico novo no agendamento.";
      status.className = "bt-form-status is-info";
    }
  } catch (error) {
    alternarFormularioDisponivel(false);
    status.style.display = "block";
    status.textContent = error.message || "Erro ao carregar o formulario.";
    status.className = "bt-form-status is-error";
  }
}

function configurarFormulario() {
  const form = document.getElementById("agendamento-form");
  const radios = document.querySelectorAll('input[name="tipo_servico"]');

  radios.forEach((radio) => {
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
  const campoHorario = document.getElementById("horario");
  campoHorario.min = gerarMinimoHorario();
}

function gerarMinimoHorario() {
  const agora = new Date();
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
  return agora.toISOString().slice(0, 16);
}

function alternarFormularioDisponivel(estaDisponivel) {
  const elementos = document.querySelectorAll(
    "#agendamento-form input, #agendamento-form select, #agendamento-form button"
  );

  elementos.forEach((elemento) => {
    if (elemento.id === "btn-logout") return;
    elemento.disabled = !estaDisponivel;
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
    status.textContent = "Selecione um cliente e informe um horario valido.";
    status.className = "bt-form-status is-error";
    return;
  }

  if (!usandoNovo && !payload.servico_id) {
    status.style.display = "block";
    status.textContent = "Selecione um servico existente para continuar.";
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
      throw new Error(body.erro || body.error || "Nao foi possivel agendar.");
    }

    const tipoServico = body.servico_criado
      ? "Servico criado e vinculado ao agendamento."
      : body.servico_reutilizado
        ? "Servico existente reaproveitado automaticamente."
        : "Servico existente utilizado no agendamento.";

    status.textContent = `${body.mensagem || "Agendamento criado com sucesso."} ${tipoServico}`;
    status.className = "bt-form-status is-success";

    if (body.servico_criado) {
      adicionarServicoCriadoAoSelect(body.servico_id, payload);
    }

    formResetAposSucesso();
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

  const jaExiste = state.servicos.some((servico) => servico.id === servicoId);
  if (jaExiste) return;

  const novoServico = {
    id: servicoId,
    nome: payload.servico_nome,
    duracao_min: payload.servico_duracao_min,
    preco: payload.servico_preco,
  };

  state.servicos.push(novoServico);
  state.servicos.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const servicoSelect = document.getElementById("servico_id");
  servicoSelect.innerHTML = [
    '<option value="">Selecione um serviço</option>',
    ...state.servicos.map(
      (servico) =>
        `<option value="${servico.id}">${servico.nome} · ${servico.duracao_min} min · R$ ${Number(servico.preco).toFixed(2)}</option>`
    ),
  ].join("");
}

function formatarHorarioParaApi(valor) {
  if (!valor) return "";
  return `${valor}:00`.replace("T", " ");
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
