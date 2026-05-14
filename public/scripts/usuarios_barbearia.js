// ─── Estado global
let tabAtiva = "barbeiros";
let dados = { barbeiros: [], clientes: [] };
let pendingAction = null; // { tipo, id, ativo }
let edicaoAtual = null; // { tipo, id }

// ─── Elementos — tabela
const tbody = document.getElementById("gu-tbody");
const stateLoad = document.getElementById("gu-loading");
const stateEmpty = document.getElementById("gu-empty");
const stateError = document.getElementById("gu-error");
const errorMsg = document.getElementById("gu-error-msg");
const searchInput = document.getElementById("gu-search");
const filterStatus = document.getElementById("gu-filter-status");
const countBarbeiros = document.getElementById("count-barbeiros");
const countClientes = document.getElementById("count-clientes");

// ─── Elementos — modal de status
const modalOverlay = document.getElementById("modal-overlay");
const modalTitle = document.getElementById("modal-title");
const modalDesc = document.getElementById("modal-desc");
const modalIcon = document.getElementById("modal-icon");
const modalConfirm = document.getElementById("modal-confirm");
const modalCancel = document.getElementById("modal-cancel");

// ─── Elementos — modal de edição
const modalEdicaoOverlay = document.getElementById("modal-edicao-overlay");
const modalEdicaoTitle = document.getElementById("modal-edicao-title");
const modalEdicaoErro = document.getElementById("modal-edicao-erro");
const modalEdicaoSucesso = document.getElementById("modal-edicao-sucesso");
const formEdicao = document.getElementById("form-edicao");
const editFieldCpf = document.getElementById("edit-field-cpf");
const btnEdicaoSalvar = document.getElementById("modal-edicao-salvar");
const btnEdicaoCancelar = document.getElementById("modal-edicao-cancelar");
const btnEdicaoFechar = document.getElementById("modal-edicao-fechar");

// ─── Helpers de estado da tabela
function mostrarEstado(estado) {
  stateLoad.classList.add("hidden");
  stateEmpty.classList.add("hidden");
  stateError.classList.add("hidden");
  tbody.innerHTML = "";

  if (estado === "loading") stateLoad.classList.remove("hidden");
  if (estado === "empty") stateEmpty.classList.remove("hidden");
  if (estado === "error") stateError.classList.remove("hidden");
}

function formatarData(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

// ─── Renderizar tabela
function renderTabela() {
  const termo = searchInput.value.trim().toLowerCase();
  const filtro = filterStatus.value;
  const lista = tabAtiva === "barbeiros" ? dados.barbeiros : dados.clientes;

  const filtrados = lista.filter((u) => {
    const buscaOk =
      !termo ||
      u.nome_completo.toLowerCase().includes(termo) ||
      (u.email || "").toLowerCase().includes(termo);

    const statusOk =
      filtro === "todos" ||
      (filtro === "ativo" && u.ativo) ||
      (filtro === "inativo" && !u.ativo);

    return buscaOk && statusOk;
  });

  if (filtrados.length === 0) {
    mostrarEstado("empty");
    return;
  }

  stateLoad.classList.add("hidden");
  stateEmpty.classList.add("hidden");
  stateError.classList.add("hidden");

  const tipo = tabAtiva === "barbeiros" ? "barbeiro" : "cliente";

  tbody.innerHTML = filtrados
    .map((u) => {
      const statusClass = u.ativo ? "ativo" : "inativo";
      const statusLabel = u.ativo ? "Ativo" : "Inativo";
      const statusIcon = u.ativo
        ? "fa-solid fa-circle-check"
        : "fa-solid fa-circle-xmark";
      const btnClass = u.ativo ? "desativar" : "ativar";
      const btnIcon = u.ativo ? "fa-solid fa-ban" : "fa-solid fa-circle-check";
      const btnLabel = u.ativo ? "Desativar" : "Ativar";

      return `
        <tr>
          <td>
            <div class="gu-user-cell">
              <div class="gu-avatar">${u.iniciais}</div>
              <span class="gu-user-name">${u.nome_completo}</span>
            </div>
          </td>
          <td>${u.email || "—"}</td>
          <td>${u.telefone || "—"}</td>
          <td>${formatarData(u.created_at)}</td>
          <td>
            <span class="gu-status ${statusClass}">
              <i class="${statusIcon}"></i> ${statusLabel}
            </span>
          </td>
          <td class="gu-actions-cell">
            <button
              class="gu-action-btn editar"
              onclick="abrirEdicao('${tipo}', ${u.id})"
              title="Editar"
            >
              <i class="fa-solid fa-pen"></i> Editar
            </button>
            <button
              class="gu-action-btn ${btnClass}"
              onclick="confirmarAcao('${tipo}', ${u.id}, ${!u.ativo}, '${u.nome_completo}')"
            >
              <i class="${btnIcon}"></i> ${btnLabel}
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

// ─── Carregar dados
async function carregarDados() {
  mostrarEstado("loading");

  try {
    const [resBarbeiros, resClientes] = await Promise.all([
      fetch("/api/usuarios/barbeiros"),
      fetch("/api/usuarios/clientes"),
    ]);

    if (!resBarbeiros.ok || !resClientes.ok) throw new Error("Erro na API");

    const { barbeiros } = await resBarbeiros.json();
    const { clientes } = await resClientes.json();

    dados.barbeiros = barbeiros;
    dados.clientes = clientes;

    countBarbeiros.textContent = barbeiros.length;
    countClientes.textContent = clientes.length;

    renderTabela();
  } catch (err) {
    console.error("[carregarDados]", err);
    errorMsg.textContent = "Erro ao carregar usuários.";
    mostrarEstado("error");
  }
}

// MODAL DE STATUS (ativar / desativar)

function confirmarAcao(tipo, id, novoAtivo, nome) {
  pendingAction = { tipo, id, ativo: novoAtivo };

  const acao = novoAtivo ? "ativar" : "desativar";

  modalIcon.className = `gu-modal-icon ${acao}`;
  modalIcon.innerHTML = novoAtivo
    ? `<i class="fa-solid fa-circle-check"></i>`
    : `<i class="fa-solid fa-ban"></i>`;

  modalTitle.textContent = novoAtivo ? "Ativar usuário" : "Desativar usuário";
  modalDesc.textContent = novoAtivo
    ? `Deseja reativar o acesso de ${nome}?`
    : `Deseja desativar o acesso de ${nome}? Ele não conseguirá mais fazer login.`;

  modalConfirm.className = `gu-modal-btn confirm ${acao}`;
  modalConfirm.textContent = novoAtivo ? "Sim, ativar" : "Sim, desativar";

  modalOverlay.classList.remove("hidden");
}

function fecharModal() {
  modalOverlay.classList.add("hidden");
  pendingAction = null;
  modalConfirm.disabled = false;
  modalCancel.disabled = false;
}

async function executarAcao() {
  if (!pendingAction) return;

  const { tipo, id, ativo } = pendingAction;
  modalConfirm.disabled = true;
  modalCancel.disabled = true;

  try {
    const res = await fetch(`/api/usuarios/${tipo}/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const lista = tipo === "barbeiro" ? dados.barbeiros : dados.clientes;
    const idx = lista.findIndex((u) => u.id === id);
    if (idx !== -1) lista[idx].ativo = ativo;

    fecharModal();
    renderTabela();
  } catch (err) {
    console.error("[executarAcao]", err);
    modalConfirm.disabled = false;
    modalCancel.disabled = false;
    modalDesc.textContent = "Ocorreu um erro. Tente novamente.";
  }
}

// MODAL DE EDIÇÃO

function abrirEdicao(tipo, id) {
  const lista = tipo === "barbeiro" ? dados.barbeiros : dados.clientes;
  const usuario = lista.find((u) => u.id === id);
  if (!usuario) return;

  edicaoAtual = { tipo, id };

  modalEdicaoTitle.textContent = `Editar ${tipo === "barbeiro" ? "Barbeiro" : "Cliente"}`;

  document.getElementById("edit-nome").value = usuario.nome || "";
  document.getElementById("edit-sobrenome").value = usuario.sobrenome || "";
  document.getElementById("edit-email").value = usuario.email || "";
  document.getElementById("edit-telefone").value = usuario.telefone || "";
  document.getElementById("edit-senha").value = "";

  if (tipo === "barbeiro") {
    editFieldCpf.classList.remove("hidden");
    document.getElementById("edit-cpf").value = usuario.cpf || "";
  } else {
    editFieldCpf.classList.add("hidden");
    document.getElementById("edit-cpf").value = "";
  }

  modalEdicaoErro.classList.add("hidden");
  modalEdicaoErro.textContent = "";
  modalEdicaoSucesso.classList.add("hidden");
  modalEdicaoSucesso.textContent = "";
  btnEdicaoSalvar.disabled = false;
  btnEdicaoSalvar.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Salvar`;

  modalEdicaoOverlay.classList.remove("hidden");
}

function fecharEdicao() {
  modalEdicaoOverlay.classList.add("hidden");
  edicaoAtual = null;
}

async function salvarEdicao(e) {
  e.preventDefault();
  if (!edicaoAtual) return;

  const { tipo, id } = edicaoAtual;
  const lista = tipo === "barbeiro" ? dados.barbeiros : dados.clientes;
  const original = lista.find((u) => u.id === id);

  const nome = document.getElementById("edit-nome").value.trim();
  const sobrenome = document.getElementById("edit-sobrenome").value.trim();
  const email = document.getElementById("edit-email").value.trim();
  const telefone = document.getElementById("edit-telefone").value.trim();
  const senha = document.getElementById("edit-senha").value;
  const cpf = document.getElementById("edit-cpf").value.trim();

  // Envia apenas os campos que foram alterados
  const payload = {};
  if (nome !== (original.nome || "")) payload.nome = nome;
  if (sobrenome !== (original.sobrenome || "")) payload.sobrenome = sobrenome;
  if (email !== (original.email || "")) payload.email = email;
  if (telefone !== (original.telefone || "")) payload.telefone = telefone;
  if (tipo === "barbeiro" && cpf !== (original.cpf || "")) payload.cpf = cpf;
  if (senha) payload.senha = senha;

  if (Object.keys(payload).length === 0) {
    modalEdicaoErro.textContent = "Nenhuma alteração detectada.";
    modalEdicaoErro.classList.remove("hidden");
    return;
  }

  modalEdicaoErro.classList.add("hidden");
  modalEdicaoSucesso.classList.add("hidden");
  btnEdicaoSalvar.disabled = true;
  btnEdicaoSalvar.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Salvando...`;

  try {
    const res = await fetch(`/api/usuarios/${tipo}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      modalEdicaoErro.textContent = data.error || "Erro ao salvar.";
      modalEdicaoErro.classList.remove("hidden");
      btnEdicaoSalvar.disabled = false;
      btnEdicaoSalvar.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Salvar`;
      return;
    }

    // Atualiza dado local
    const idx = lista.findIndex((u) => u.id === id);
    if (idx !== -1) {
      if (payload.nome) lista[idx].nome = payload.nome;
      if (payload.sobrenome) lista[idx].sobrenome = payload.sobrenome;
      if (payload.email) lista[idx].email = payload.email;
      if (payload.telefone) lista[idx].telefone = payload.telefone;
      if (payload.cpf) lista[idx].cpf = payload.cpf;
      lista[idx].nome_completo = `${lista[idx].nome} ${lista[idx].sobrenome}`;
      lista[idx].iniciais = (
        lista[idx].nome[0] + lista[idx].sobrenome[0]
      ).toUpperCase();
    }

    modalEdicaoSucesso.textContent = "Dados atualizados com sucesso!";
    modalEdicaoSucesso.classList.remove("hidden");
    btnEdicaoSalvar.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Salvar`;

    setTimeout(() => {
      fecharEdicao();
      renderTabela();
    }, 1200);
  } catch (err) {
    console.error("[salvarEdicao]", err);
    modalEdicaoErro.textContent = "Erro de conexão. Tente novamente.";
    modalEdicaoErro.classList.remove("hidden");
    btnEdicaoSalvar.disabled = false;
    btnEdicaoSalvar.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Salvar`;
  }
}

// ─── Eventos — modal de edição
formEdicao.addEventListener("submit", salvarEdicao);
btnEdicaoCancelar.addEventListener("click", fecharEdicao);
btnEdicaoFechar.addEventListener("click", fecharEdicao);
modalEdicaoOverlay.addEventListener("click", (e) => {
  if (e.target === modalEdicaoOverlay) fecharEdicao();
});

// ─── Tabs
document.querySelectorAll(".gu-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".gu-tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    tabAtiva = tab.dataset.tab;
    searchInput.value = "";
    filterStatus.value = "todos";
    renderTabela();
  });
});

// ─── Busca / filtro
let debounceTimer;
searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(renderTabela, 250);
});
filterStatus.addEventListener("change", renderTabela);

// ─── Eventos — modal de status
modalConfirm.addEventListener("click", executarAcao);
modalCancel.addEventListener("click", fecharModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) fecharModal();
});
document.getElementById("gu-retry").addEventListener("click", carregarDados);

// ─── Logout
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

// ─── Hamburguer
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
overlay.addEventListener("click", fecharSidebar);
sidebar.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    if (window.innerWidth <= 900) fecharSidebar();
  });
});

// ─── Nome da barbearia
try {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (usuario?.nome) {
    document.getElementById("nome-barbearia").textContent = usuario.nome;
  }
} catch (error) {
  console.error("Erro ao carregar dados do usuário:", error);
  document.getElementById("nome-barbearia").textContent = "Barbearia";
}

// ─── Init
document.addEventListener("DOMContentLoaded", carregarDados);

//para não acusar erro no lint
window.confirmarAcao = confirmarAcao;
window.abrirEdicao = abrirEdicao;
