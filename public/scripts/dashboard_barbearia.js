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

// ─── MODAL CADASTRO DE CLIENTE ───────────────────────────────────────────────
// Cole no final do dashboard_barbearia.js

(function () {
  const overlay = document.getElementById("modal-cliente-overlay");
  const formCliente = document.getElementById("form-cliente");
  const btnFechar = document.getElementById("modal-cliente-fechar");
  const btnCancelar = document.getElementById("modal-cliente-cancelar");
  const btnSalvar = document.getElementById("modal-cliente-salvar");
  const elErro = document.getElementById("modal-cliente-erro");
  const elSucesso = document.getElementById("modal-cliente-sucesso");
  const btnAbrir = document.querySelector(".qa-btn[data-modal='cliente']");

  const inputNome = document.getElementById("cliente-nome");
  const inputSobrenome = document.getElementById("cliente-sobrenome");
  const inputEmail = document.getElementById("cliente-email");
  const inputTelefone = document.getElementById("cliente-telefone");
  const inputSenha = document.getElementById("cliente-senha");

  function removerNaoNumeros(valor) {
    return valor.replace(/\D/g, "");
  }

  function nomeEhValido(valor) {
    return valor.length >= 2 && /^[A-Za-zÀ-ÿ\s'-]+$/.test(valor);
  }

  function emailEhValido(valor) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
  }

  function telefoneEhValido(valor) {
    const nums = removerNaoNumeros(valor);
    return nums.length >= 10 && nums.length <= 11;
  }

  function senhaEhValida(valor) {
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      valor
    );
  }

  function formatarTelefone(valor) {
    const n = removerNaoNumeros(valor).slice(0, 11);
    if (n.length <= 2) return n;
    if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
    if (n.length <= 10)
      return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
    return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  }

  // ─── Validação por campo — retorna mensagem de erro ou null
  function validarCampo(input) {
    const v = input.value.trim();

    if (input === inputNome || input === inputSobrenome) {
      if (!v) return "Campo obrigatório.";
      if (!nomeEhValido(v))
        return "Digite ao menos 2 letras e use apenas caracteres válidos.";
    }

    if (input === inputEmail) {
      if (!v) return "Informe o e-mail.";
      if (!emailEhValido(v)) return "Digite um e-mail válido.";
    }

    if (input === inputTelefone) {
      if (!v) return "Informe o telefone.";
      if (!telefoneEhValido(v))
        return "Digite um telefone com 10 ou 11 dígitos.";
    }

    if (input === inputSenha) {
      if (!v) return "Informe a senha.";
      if (!senhaEhValida(v))
        return "A senha deve ter pelo menos 8 caracteres, 1 letra maiúscula, 1 número e 1 caractere especial.";
    }

    return null;
  }

  // ─── Feedback visual por campo
  function marcarInvalido(input, msg) {
    input.classList.add("is-invalid");
    input.classList.remove("is-valid");
    let span = input.parentElement.querySelector(".campo-erro");
    if (!span) {
      span = document.createElement("span");
      span.className = "campo-erro";
      input.parentElement.appendChild(span);
    }
    span.textContent = msg;
  }

  function marcarValido(input) {
    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
    const span = input.parentElement.querySelector(".campo-erro");
    if (span) span.textContent = "";
  }

  function limparMarcacao(input) {
    input.classList.remove("is-invalid", "is-valid");
    const span = input.parentElement.querySelector(".campo-erro");
    if (span) span.textContent = "";
  }

  function validarEMarcar(input) {
    const erro = validarCampo(input);
    if (erro) {
      marcarInvalido(input, erro);
      return false;
    }
    marcarValido(input);
    return true;
  }

  function validarTodos() {
    return [inputNome, inputSobrenome, inputEmail, inputTelefone, inputSenha]
      .map(validarEMarcar)
      .every(Boolean);
  }

  // ─── Validação em tempo real
  [inputNome, inputSobrenome, inputEmail, inputSenha].forEach((input) => {
    input.addEventListener("blur", () => validarEMarcar(input));
    input.addEventListener("input", () => validarEMarcar(input));
  });

  inputTelefone.addEventListener("input", () => {
    inputTelefone.value = formatarTelefone(inputTelefone.value);
    validarEMarcar(inputTelefone);
  });
  inputTelefone.addEventListener("blur", () => validarEMarcar(inputTelefone));

  // ─── Feedback global
  function mostrarErro(msg) {
    elErro.textContent = msg;
    elErro.classList.remove("hidden");
    elSucesso.classList.add("hidden");
  }

  function mostrarSucesso(msg) {
    elSucesso.textContent = msg;
    elSucesso.classList.remove("hidden");
    elErro.classList.add("hidden");
  }

  function esconderFeedback() {
    elErro.classList.add("hidden");
    elSucesso.classList.add("hidden");
  }

  // ─── Abrir / fechar
  function abrirModal() {
    formCliente.reset();
    [inputNome, inputSobrenome, inputEmail, inputTelefone, inputSenha].forEach(
      limparMarcacao
    );
    document
      .querySelectorAll("#form-cliente .campo-erro")
      .forEach((s) => (s.textContent = ""));
    esconderFeedback();
    btnSalvar.disabled = false;
    btnSalvar.innerHTML = `<i class="fa-solid fa-user-plus"></i> Cadastrar`;
    overlay.classList.remove("hidden");
  }

  function fecharModal() {
    overlay.classList.add("hidden");
  }

  // ─── Submit
  async function cadastrarCliente(e) {
    e.preventDefault();
    esconderFeedback();

    if (!validarTodos()) {
      mostrarErro("Revise os campos destacados para continuar.");
      return;
    }

    const nome = inputNome.value.trim();
    const sobrenome = inputSobrenome.value.trim();
    const email = inputEmail.value.trim();
    const telefone = removerNaoNumeros(inputTelefone.value);
    const senha = inputSenha.value;

    btnSalvar.disabled = true;
    btnSalvar.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Cadastrando...`;

    try {
      const res = await fetch("/cliente/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, sobrenome, email, telefone, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "Email ja cadastrado.") {
          marcarInvalido(inputEmail, "Este e-mail já está cadastrado.");
        }
        mostrarErro(data.error || "Não foi possível concluir o cadastro.");
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = `<i class="fa-solid fa-user-plus"></i> Cadastrar`;
        return;
      }

      mostrarSucesso(`Cliente ${nome} cadastrado com sucesso!`);
      btnSalvar.innerHTML = `<i class="fa-solid fa-user-plus"></i> Cadastrar`;
      setTimeout(fecharModal, 1500);
    } catch (err) {
      console.error("[cadastrarCliente]", err);
      mostrarErro("Erro de conexão. Tente novamente.");
      btnSalvar.disabled = false;
      btnSalvar.innerHTML = `<i class="fa-solid fa-user-plus"></i> Cadastrar`;
    }
  }

  // ─── Eventos
  if (btnAbrir)
    btnAbrir.addEventListener("click", (e) => {
      e.preventDefault();
      abrirModal();
    });
  btnFechar.addEventListener("click", fecharModal);
  btnCancelar.addEventListener("click", fecharModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) fecharModal();
  });
  formCliente.addEventListener("submit", cadastrarCliente);
})();
