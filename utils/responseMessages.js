const responseMessages = {
  requiredClienteFields: "Todos os campos sao obrigatorios.",
  duplicateClienteEmail: "Email ja cadastrado.",
  requiredBarbeiroFields:
    "nome, sobrenome, cpf, email, telefone e senha sao obrigatorios",
  duplicateBarbeiroCpf: "CPF ja cadastrado para outro barbeiro",
  duplicateBarbeiroEmail: "Email informado ja esta em uso por outro barbeiro",
  duplicateBarbeariaEmail: "Email informado ja esta em uso",
  duplicateBarbeariaTelefone: "Telefone informado ja esta em uso",
  duplicateBarbeariaCnpj: "Cnpj ja cadastrado",
  invalidBarbeariaFields:
    "nome_fantasia, razao_social, cnpj e senha sao obrigatorios",
  invalidCpf: "CPF invalido. Ele deve conter 11 digitos.",
  invalidEmail: "Email invalido.",
  invalidCnpj: "CNPJ invalido. Ele deve conter 14 digitos.",
  invalidTelefone: "Telefone invalido. Ele deve conter 10 ou 11 digitos.",
  invalidPasswordLength: "A senha deve ter pelo menos 8 caracteres",
  createdCliente: "Usuario cadastrado com sucesso.",
  createdBarbeiro: "Barbeiro cadastrado com sucesso.",
  createdBarbearia: "Barbearia cadastrada com sucesso",
  userNotFound: "Usuario nao encontrado",
  invalidCredentials: "E-mail ou senha incorreto",
  sessionError: "Erro ao iniciar sessao",
  processingError: "Erro no processamento",
  internalServerError: "Erro interno do servidor",
  unauthenticated: "Usuario nao autenticado",
  authenticated: "Usuario autenticado",
  accessDenied: "Acesso negado",
};

module.exports = responseMessages;
