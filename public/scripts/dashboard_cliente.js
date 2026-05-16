const DIAS = [
  "Domingo",
  "Segunda",
  "Terca",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sabado",
];

document.addEventListener("DOMContentLoaded", () => {
  configurarLogout();
  carregarDashboard();
});

async function carregarDashboard() {
  await Promise.all([carregarBarbearias(), carregarHorarios()]);
}

async function carregarBarbearias() {
  const status = document.getElementById("barbearias-status");
  const container = document.getElementById("barbearias-container");

  try {
    const resposta = await fetch("/cliente/barbearias");
    const corpo = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        corpo.error || "Nao foi possivel carregar as barbearias."
      );
    }

    const barbearias = corpo.barbearias || [];

    if (!barbearias.length) {
      status.style.display = "block";
      status.textContent = "Nenhuma barbearia disponivel no momento.";
      status.className = "bt-form-status is-info";
      container.innerHTML = "";
      return;
    }

    status.style.display = "none";
    container.innerHTML = barbearias
      .map(
        (barbearia) => `
          <div class="bt-list-row">
            <div>
              <div class="bt-list-title">${barbearia.nome_fantasia}</div>
              <div class="bt-list-meta">
                ${barbearia.email || "Sem email"}${barbearia.telefone ? ` · ${barbearia.telefone}` : ""}
              </div>
            </div>
            <a class="bt-btn bt-btn-secondary" href="/cliente/agenda?barbearia_id=${barbearia.id}">
              Agendar
            </a>
          </div>
        `
      )
      .join("");
  } catch (error) {
    status.style.display = "block";
    status.textContent = error.message || "Erro ao carregar as barbearias.";
    status.className = "bt-form-status is-error";
    container.innerHTML = "";
  }
}

async function carregarHorarios() {
  const status = document.getElementById("horarios-status");
  const container = document.getElementById("horarios-container");

  try {
    const resposta = await fetch("/cliente/horarios");
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
