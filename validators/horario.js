const responseMessages = require("../utils/responseMessages");

const DIAS_VALIDOS = [0, 1, 2, 3, 4, 5, 6];

function validarHorario(horario) {
  const { dia_semana, abertura, fechamento, fechado } = horario;

  if (!DIAS_VALIDOS.includes(Number(dia_semana))) {
    return responseMessages.invalidDiaSemana;
  }

  if (!fechado) {
    if (!abertura || !fechamento) {
      return responseMessages.requiredHorarioFields;
    }

    if (abertura >= fechamento) {
      return responseMessages.invalidHorarioRange;
    }
  }

  return null;
}

function validateHorariosPayload(horarios) {
  if (!Array.isArray(horarios) || horarios.length === 0) {
    return responseMessages.requiredHorarioFields;
  }

  for (const horario of horarios) {
    const error = validarHorario(horario);
    if (error) return error;
  }

  return null;
}

module.exports = { validateHorariosPayload };
