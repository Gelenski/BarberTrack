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
  carregarPagina();
});

async function carregarPagina() {
  await Promise.all([carregarHorarios(), carregarDadosFormulario()]);
}

async function carregarHorarios() {
  const status = document.getElementById("horarios-status");
  const container = document.getElementById("horarios-container");

  try {
    const resposta = await fetch("/barbeiro/horarios");
    const corpo = await resposta.json();

    if (!resposta.ok) {
      throw new Error(corpo.error || "Nao foi possivel carregar os horarios.");
    }

    if (!corpo.horarios || corpo.horarios.length === 0) {
      status.style.display = "block";
      status.textContent = "Nenhum horario cadastrado pela barbearia ainda.";
      status.className = "bt-form-status is-info";
      container.innerHTML = "";
      return;
    }

    status.style.display = "none";
    container.innerHTML = corpo.horarios
      .map((h) => {
        const dia = DIAS[h.dia_semana];
        const info = h.fechado
          ? "Fechado"
          : `${h.abertura.slice(0, 5)} - ${h.fechamento.slice(0, 5)}`;

        return `
          <div class="bt-list-row">
            <span class="bt-list-title">${dia}</span>
            <span class="bt-list-meta ${h.fechado ? "" : "is-gold"}">${info}</span>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    status.style.display = "block";
    status.textContent = error.message || "Erro ao carregar horarios.";
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
      '<option value="">Selecione um servico</option>',
      ...state.servicos.map(
        (servico) =>
          `<option value="${servico.id}">${servico.nome} · ${servico.duracao_min} min · R$ ${Number(servico.preco).toFixed(2)}</option>`
      ),
    ].join("");

    if (!state.clientes.length) {
      alternarFormularioDisponivel(false);
      status.style.display = "block";
      status.textContent =
        "Nenhum cliente vinculado a esta barbearia. Vincule um cliente antes de agendar.";
      status.className = "bt-form-status is-info";
      return;
    }

    if (!state.servicos.length) {
      alternarFormularioDisponivel(false);
      status.style.display = "block";
      status.textContent =
        "Nenhum servico ativo encontrado. Cadastre um servico antes de criar agendamentos.";
      status.className = "bt-form-status is-info";
      return;
    }

    alternarFormularioDisponivel(true);
    status.style.display = "none";
  } catch (error) {
    alternarFormularioDisponivel(false);
    status.style.display = "block";
    status.textContent = error.message || "Erro ao carregar o formulario.";
    status.className = "bt-form-status is-error";
  }
}

function configurarFormulario() {
  const form = document.getElementById("agendamento-form");
  form.addEventListener("submit", enviarAgendamento);
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
    elemento.disabled = !estaDisponivel;
  });
}

async function enviarAgendamento(event) {
  event.preventDefault();

  const btn = document.getElementById("btn-agendar");
  const status = document.getElementById("agendamento-status");
  const payload = {
    cliente_id: Number(document.getElementById("cliente_id").value),
    servico_id: Number(document.getElementById("servico_id").value),
    horario: formatarHorarioParaApi(document.getElementById("horario").value),
    observacao: document.getElementById("observacao").value.trim() || undefined,
  };

  if (!payload.cliente_id || !payload.servico_id || !payload.horario) {
    status.style.display = "block";
    status.textContent =
      "Selecione cliente, servico e informe um horario valido.";
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

    status.textContent = body.mensagem || "Agendamento criado com sucesso.";
    status.className = "bt-form-status is-success";
    document.getElementById("agendamento-form").reset();
    configurarCampoHorario();
  } catch (error) {
    status.textContent = error.message || "Erro ao criar agendamento.";
    status.className = "bt-form-status is-error";
  } finally {
    btn.disabled = false;
    btn.textContent = "Confirmar agendamento";
  }
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
