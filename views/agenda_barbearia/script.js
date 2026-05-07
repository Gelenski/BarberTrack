
const inputData = document.getElementById('filtro-data');
const selectBarbeiro = document.getElementById('filtro-barbeiro');
const tabela = document.getElementById('tabela');
const tbody = document.getElementById('tbody');
const estadoVazio = document.getElementById('estado-vazio');
const estadoLoading = document.getElementById('estado-loading');
const metricas = document.getElementById('metricas');

// Define data padrão = hoje
const hoje = new Date().toISOString().split('T')[0];
inputData.value = hoje;

function formatarHorario(isoString) {
    const d = new Date(isoString);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatarPreco(preco) {
    return Number(preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function statusLabel(status) {
    const map = {
    confirmado: '<span class="status-badge status-confirmado">Confirmado</span>',
    cancelado:  '<span class="status-badge status-cancelado">Cancelado</span>',
    concluido:  '<span class="status-badge status-concluido">Concluído</span>',
    };
    return map[status] || status;
}

function atualizarMetricas(agendamentos) {
    const total = agendamentos.length;
    const confirmados = agendamentos.filter(a => a.status === 'confirmado').length;
    const concluidos  = agendamentos.filter(a => a.status === 'concluido').length;
    const cancelados  = agendamentos.filter(a => a.status === 'cancelado').length;
    const receita = agendamentos
    .filter(a => a.status !== 'cancelado')
    .reduce((acc, a) => acc + Number(a.preco), 0);

    document.getElementById('m-total').textContent = total;
    document.getElementById('m-confirmados').textContent = confirmados;
    document.getElementById('m-concluidos').textContent = concluidos;
    document.getElementById('m-cancelados').textContent = cancelados;
    document.getElementById('m-receita').textContent = formatarPreco(receita);

    metricas.style.display = 'grid';
}

function popularBarbeiros(barbeiros) {
    // Mantém a opção "Todos" e adiciona apenas os novos
    const valorAtual = selectBarbeiro.value;
    selectBarbeiro.innerHTML = '<option value="">Todos os barbeiros</option>';
    barbeiros.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.textContent = b.nome;
    selectBarbeiro.appendChild(opt);
    });
    selectBarbeiro.value = valorAtual;
}

function renderizarLinhas(agendamentos) {
    tbody.innerHTML = '';
    agendamentos.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><span class="horario-badge">${formatarHorario(a.horario)}</span></td>
        <td>
        <div class="cliente-info">
            <div class="nome">${a.cliente_nome}</div>
            ${a.cliente_telefone ? `<div class="telefone">${a.cliente_telefone}</div>` : ''}
        </div>
        </td>
        <td>${a.barbeiro_nome}</td>
        <td>${a.servico_nome}</td>
        <td class="col-duracao">${a.duracao_min} min</td>
        <td class="preco">${formatarPreco(a.preco)}</td>
        <td>${statusLabel(a.status)}</td>
        <td class="col-observacao" style="font-size:0.8rem;color:rgba(240,230,200,0.4);">${a.observacao || '—'}</td>
    `;
    tbody.appendChild(tr);
    });
}

async function carregarAgendamentos() {
    // Mostrar loading
    estadoLoading.style.display = 'block';
    tabela.style.display = 'none';
    estadoVazio.style.display = 'none';
    metricas.style.display = 'none';

    const data = inputData.value;
    const barbeiroId = selectBarbeiro.value;

    const params = new URLSearchParams({ data });
    if (barbeiroId) params.append('barbeiro_id', barbeiroId);

    try {
    const res = await fetch(`/barbearia/agenda/agendamentos?${params}`);
    if (!res.ok) throw new Error('Erro na requisição');
    const { agendamentos, barbeiros } = await res.json();

    popularBarbeiros(barbeiros);
    estadoLoading.style.display = 'none';

    if (agendamentos.length === 0) {
        estadoVazio.style.display = 'block';
        metricas.style.display = 'none';
        return;
    }

    renderizarLinhas(agendamentos);
    atualizarMetricas(agendamentos);
    tabela.style.display = 'table';

    } catch (err) {
    estadoLoading.textContent = 'Erro ao carregar agendamentos. Tente novamente.';
    console.error(err);
    }
}

// Carrega ao abrir a página
carregarAgendamentos();
