const perfis = {
  barbearia: {
    tipo: "barbearia",
    tabela: "barbearia",
    campoNome: "nome_fantasia",
    redirectPath: "/barbearia/dashboard",
  },
  cliente: {
    tipo: "cliente",
    tabela: "cliente",
    campoNome: "nome",
    redirectPath: "/cliente/dashboard",
  },
};

function resolveAuthProfile(tipo) {
  return perfis[tipo] || perfis.cliente;
}

module.exports = {
  resolveAuthProfile,
};
