const DIAS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

async function carregarHorarios() {
  const status = document.getElementById("horarios-status");
  const container = document.getElementById("horarios-container");

  try {
    const resposta = await fetch("/cliente/horarios");
    const corpo = await resposta.json();

    // Esconde o aviso de carregamento
    status.style.display = "none";

    if (!corpo.horarios || corpo.horarios.length === 0) {
      status.style.display = "block";
      status.textContent = "Nenhum horário cadastrado pela barbearia ainda.";
      return;
    }

    container.innerHTML = corpo.horarios
      .map((h) => {
        const dia = DIAS[h.dia_semana];
        const info = h.fechado
          ? "Fechado"
          : `${h.abertura.slice(0, 5)} - ${h.fechamento.slice(0, 5)}`;

        return `
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.6rem 0;
            border-bottom: 1px solid var(--border);
            font-size: 0.9rem;
          ">
            <span style="font-weight: 500; color: var(--text);">${dia}</span>
            <span style="color: ${h.fechado ? "var(--muted)" : "var(--gold)"};">
              ${info}
            </span>
          </div>
        `;
      })
      .join("");
  } catch {
    status.textContent = "Erro ao carregar horários. Tente novamente.";
    status.className = "bt-form-status is-error";
  }
}

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

carregarHorarios();
