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

// Inicia o carregamento dos horários assim que a página carrega
carregarHorarios();

// ════════════════════════════════════════════
// FIM NOVO
// ════════════════════════════════════════════
