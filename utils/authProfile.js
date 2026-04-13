const perfis = {
  // Este mapa evita espalhar condicionais de perfil pelas rotas de autenticacao.
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
  // Valores inesperados mantem o comportamento legado e caem em cliente.
  return perfis[tipo] || perfis.cliente;
}

module.exports = {
  resolveAuthProfile,
};
