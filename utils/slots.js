function timeToMinutes(timeStr) {
  const parts = String(timeStr).split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function minutesToTime(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Gera lista de horários disponíveis para um barbeiro em uma data.
 * @param {string} data          - "YYYY-MM-DD"
 * @param {string} inicio        - "HH:MM" ou "HH:MM:SS" (começo do turno)
 * @param {string} fim           - "HH:MM" ou "HH:MM:SS" (fim do turno)
 * @param {number} duracaoMin    - duração do serviço em minutos
 * @param {Array}  agendamentos  - [{horario: Date, duracao_min: number}]
 * @returns {string[]}           - ["09:00", "09:30", ...]
 */
function generateSlots(data, inicio, fim, duracaoMin, agendamentos) {
  const inicioMin = timeToMinutes(inicio);
  const fimMin = timeToMinutes(fim);
  const now = new Date();

  const bloqueados = agendamentos.map((a) => {
    const dt = new Date(a.horario);
    const hMin = dt.getHours() * 60 + dt.getMinutes();
    return { inicio: hMin, fim: hMin + parseInt(a.duracao_min, 10) };
  });

  const slots = [];

  for (let t = inicioMin; t + duracaoMin <= fimMin; t += 30) {
    const slotFim = t + duracaoMin;
    const ocupado = bloqueados.some((b) => t < b.fim && slotFim > b.inicio);

    if (!ocupado) {
      const [ano, mes, dia] = data.split("-").map(Number);
      const slotDate = new Date(ano, mes - 1, dia, Math.floor(t / 60), t % 60);
      if (slotDate > now) {
        slots.push(minutesToTime(t));
      }
    }
  }

  return slots;
}

module.exports = { generateSlots, timeToMinutes, minutesToTime };
