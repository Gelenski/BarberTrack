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
