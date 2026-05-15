async function carregarBarbeiros() {
  const list = document.getElementById("barber-list");

  list.innerHTML = `
    <div class="barber-skeleton"></div>
    <div class="barber-skeleton"></div>
    <div class="barber-skeleton"></div>
    `;

  try {
    const res = await fetch("/barbeiro/lista");

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const { barbeiros } = await res.json();

    if (!barbeiros || barbeiros.length === 0) {
      list.innerHTML = `
        <div class="barber-empty">
            <span class="empty-icon">✂</span>
            Nenhum barbeiro cadastrado ainda.<br>
            <a href="/barbeiro/cadastro">Cadastre o primeiro agora →</a>
        </div>
        `;
      return;
    }

    list.innerHTML = barbeiros
      .map(
        (b) => `
        <div class="barber-item">
        <div class="barber-avatar">${b.iniciais}</div>
        <div class="barber-info">
            <div class="barber-name">${b.nome_completo}</div>
            <div class="barber-role">${b.email || "Barbeiro"}</div>
        </div>
        <div class="online-dot"></div>
        </div>
    `
      )
      .join("");
  } catch (err) {
    console.error("[carregarBarbeiros]", err);
    list.innerHTML = `
        <div class="barber-error">
        ⚠ Erro ao carregar equipe.
        <button class="retry-btn" onclick="carregarBarbeiros()">Tentar novamente</button>
        </div>
    `;
  }
}
//exibir nome da barbearia logada
try {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (usuario?.nome) {
    document.getElementById("nome-barbearia").textContent = usuario.nome;
  }
} catch (error) {
  console.error("Erro ao carregar dados do usuário:", error);
  document.getElementById("nome-barbearia").textContent = "Barbearia";
}
//exibir dia no formato
function mostrarData() {
  const hoje = new Date();

  const dia = String(hoje.getDate()).padStart(2, "0");
  const mes = String(hoje.getMonth() + 1).padStart(2, "0"); // Janeiro é 0
  const ano = hoje.getFullYear();

  const dataFormatada = `${dia}/${mes}/${ano}`;

  document.getElementById("data-atual").innerText = dataFormatada;
}

// Executa a função ao carregar a página
window.onload = function () {
  mostrarData();
  carregarAgendaHoje();
  carregarHorarios();
};
carregarBarbeiros();

// ─── Menu hamburguer
const btnHamburger = document.getElementById("btn-hamburger");

const sidebar = document.querySelector(".sidebar");
const overlay = document.getElementById("sidebar-overlay");

function abrirSidebar() {
  sidebar.classList.add("is-open");
  overlay.classList.add("is-open");
  btnHamburger.classList.add("is-open");
  btnHamburger.setAttribute("aria-label", "Fechar menu");
}

function fecharSidebar() {
  sidebar.classList.remove("is-open");
  overlay.classList.remove("is-open");
  btnHamburger.classList.remove("is-open");
  btnHamburger.setAttribute("aria-label", "Abrir menu");
}

btnHamburger.addEventListener("click", () => {
  sidebar.classList.contains("is-open") ? fecharSidebar() : abrirSidebar();
});

// Fecha ao clicar no overlay
overlay.addEventListener("click", fecharSidebar);

// Fecha ao clicar em qualquer link/botão da sidebar (exceto config)
sidebar.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    if (window.innerWidth <= 900) fecharSidebar();
  });
});

document.getElementById("btn-logout").addEventListener("click", async () => {
  const btn = document.getElementById("btn-logout");
  btn.disabled = true;
  btn.style.opacity = "0.6";

  try {
    const res = await fetch("/auth/logout", { method: "POST" });
    const data = await res.json();
    window.location.href = data.redirect || "/auth/login";
  } catch {
    window.location.href = "/auth/login";
  }
});

document.addEventListener("DOMContentLoaded", carregarBarbeiros);

// ════════════════════════════════════════════
// NOVO: lógica dos horários de funcionamento
// ════════════════════════════════════════════

const DIAS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

// Monta o formulário com uma linha para cada dia da semana.
// Recebe o array de horários já salvos no banco (pode ser vazio).
function montarFormulario(horariosSalvos) {
  const container = document.getElementById("dias-container");
  container.innerHTML = "";

  DIAS.forEach((nome, index) => {
    // Busca se já existe um horário salvo para esse dia
    const salvo = horariosSalvos.find((h) => h.dia_semana === index);

    const fechado = salvo?.fechado ?? false;
    // .slice(0, 5) converte "09:00:00" (formato do banco) para "09:00"
    const abertura = salvo?.abertura?.slice(0, 5) ?? "";
    const fechamento = salvo?.fechamento?.slice(0, 5) ?? "";

    const row = document.createElement("div");
    row.className = `dia-row${fechado ? " fechado-row" : ""}`;

    row.innerHTML = `
      <span class="dia-nome">${nome}</span>
      <label class="dia-check">
        <input
          type="checkbox"
          class="chk-fechado"
          data-dia="${index}"
          ${fechado ? "checked" : ""}
        />
        Fechado
      </label>
      <div class="dia-time">
        <label>Abertura</label>
        <input
          type="time"
          class="inp-abertura"
          data-dia="${index}"
          value="${abertura}"
          ${fechado ? "disabled" : ""}
        />
      </div>
      <div class="dia-time">
        <label>Fechamento</label>
        <input
          type="time"
          class="inp-fechamento"
          data-dia="${index}"
          value="${fechamento}"
          ${fechado ? "disabled" : ""}
        />
      </div>
    `;

    container.appendChild(row);

    // Quando a barbearia marca "Fechado", desabilita os campos de horário
    // e deixa a linha visualmente apagada
    row.querySelector(".chk-fechado").addEventListener("change", (e) => {
      const dia = e.target.dataset.dia;
      const inpAbertura = row.querySelector(`.inp-abertura[data-dia="${dia}"]`);
      const inpFechamento = row.querySelector(
        `.inp-fechamento[data-dia="${dia}"]`
      );

      inpAbertura.disabled = e.target.checked;
      inpFechamento.disabled = e.target.checked;
      row.classList.toggle("fechado-row", e.target.checked);
    });
  });
}

// Lê os valores do formulário e monta o array para enviar ao backend
function coletarHorarios() {
  return DIAS.map((_, index) => {
    const fechado = document.querySelector(
      `.chk-fechado[data-dia="${index}"]`
    ).checked;

    const abertura = document.querySelector(
      `.inp-abertura[data-dia="${index}"]`
    ).value;

    const fechamento = document.querySelector(
      `.inp-fechamento[data-dia="${index}"]`
    ).value;

    return {
      dia_semana: index,
      fechado,
      // envia null quando fechado para limpar o banco
      abertura: fechado ? null : abertura,
      fechamento: fechado ? null : fechamento,
    };
  });
}

// Exibe a mensagem de sucesso ou erro no card-header e some após 3 segundos
function mostrarAvisoHorario(mensagem, tipo) {
  const aviso = document.getElementById("horarios-aviso");
  aviso.textContent = mensagem;
  aviso.className = `horarios-aviso ${tipo}`;

  setTimeout(() => {
    aviso.className = "horarios-aviso";
    aviso.textContent = "";
  }, 3000);
}

// Busca os horários já salvos no banco ao carregar a página
async function carregarHorarios() {
  try {
    const resposta = await fetch("/barbearia/horarios");
    const corpo = await resposta.json();
    // Se ainda não há horários cadastrados, monta o formulário em branco
    montarFormulario(corpo.horarios || []);
  } catch {
    montarFormulario([]);
  }
}

// Escuta o submit do formulário de horários e envia para o backend
document
  .getElementById("form-horarios")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = document.getElementById("btn-salvar-horarios");
    btn.disabled = true;
    btn.textContent = "Salvando...";

    try {
      const horarios = coletarHorarios();

      const resposta = await fetch("/barbearia/horarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horarios }),
      });

      const corpo = await resposta.json();

      if (resposta.ok) {
        mostrarAvisoHorario(corpo.message, "success");
      } else {
        mostrarAvisoHorario(corpo.error, "error");
      }
    } catch {
      mostrarAvisoHorario("Erro ao conectar ao servidor.", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Salvar Horários";
    }
  });

async function carregarAgendaHoje() {
  const lista = document.getElementById("agenda-hoje-list");
  const hoje = new Date().toISOString().split("T")[0];

  try {
    const res = await fetch(`/barbearia/agenda/agendamentos?data=${hoje}`);
    if (!res.ok) throw new Error();
    const { agendamentos } = await res.json();

    if (!agendamentos.length) {
      lista.innerHTML = `
        <div style="text-align:center;padding:2rem;color:var(--muted);font-size:.85rem;">
          Nenhum agendamento para hoje.
        </div>`;
      return;
    }

    lista.innerHTML = agendamentos
      .map((a) => {
        const hora = new Date(a.horario).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
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
            <div class="agenda-client">${a.cliente_nome}</div>
            <div class="agenda-service">${a.servico_nome} · ${a.duracao_min} min</div>
          </div>
          <div class="agenda-barber">${a.barbeiro_nome.split(" ")[0]}</div>
          <span class="status-pill ${a.status}">${statusLabel[a.status] ?? a.status}</span>
        </div>`;
      })
      .join("");
  } catch {
    lista.innerHTML = `
      <div style="text-align:center;padding:1.5rem;color:var(--muted);font-size:.85rem;">
        Erro ao carregar agenda.
      </div>`;
  }
}

// Inicia o carregamento dos horários assim que a página carrega

// ════════════════════════════════════════════
// FIM NOVO
// ════════════════════════════════════════════
