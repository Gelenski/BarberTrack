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
  invalidPasswordLength:
    "A senha deve ter pelo menos 8 caracteres 1 letra maiúscula e 1 carácter especial.",
  createdCliente: "Usuario cadastrado com sucesso.",
  createdBarbeiro: "Barbeiro cadastrado com sucesso.",
  createdBarbearia: "Barbearia cadastrada com sucesso",
  linkedCliente: "Cliente linkado com sucesso",
  userNotFound: "Usuario nao encontrado",
  invalidCredentials: "E-mail ou senha incorreto",
  sessionError: "Erro ao iniciar sessao",
  processingError: "Erro no processamento",
  internalServerError: "Erro interno do servidor",
  unauthenticated: "Usuario nao autenticado",
  authenticated: "Usuario autenticado",
  accessDenied: "Acesso negado",
  resetEmailSent:
    "Se este e-mail estiver cadastrado, voce recebera o link em breve.",
  invalidResetToken: "Link invalido ou expirado.",
  resetTokenUsed: "Este link ja foi utilizado.",
  passwordUpdated: "Senha redefinida com sucesso.",
  requiredResetFields: "E-mail e tipo de perfil sao obrigatorios.",
  requiredNewPasswordFields: "Token e nova senha sao obrigatorios.",
  invalidDiaSemana: "Dia da semana inválido.",
  requiredHorarioFields: "Informe abertura e fechamento para os dias abertos.",
  invalidHorarioRange: "O horário de abertura deve ser anterior ao fechamento.",
  createdHorarios: "Horários salvos com sucesso.",
};

module.exports = responseMessages;
