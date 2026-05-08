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

try {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (usuario?.nome) {
    document.getElementById("nome-barbearia").textContent = usuario.nome;
  }
} catch (error) {
  console.error("Erro ao carregar dados do usuário:", error);
  document.getElementById("nome-barbearia").textContent = "Barbearia";
}

function mostrarData() {
  const hoje = new Date();

  const dia = String(hoje.getDate()).padStart(2, "0");
  const mes = String(hoje.getMonth() + 1).padStart(2, "0"); // Janeiro é 0
  const ano = hoje.getFullYear();

  const dataFormatada = `${dia}/${mes}/${ano}`;

  document.getElementById("data-atual").innerText = dataFormatada;
}

// Executa a função ao carregar a página
window.onload = mostrarData;

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
