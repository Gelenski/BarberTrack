-- =============================================================================
-- seeds.sql
-- =============================================================================
-- Este arquivo contém dados iniciais para facilitar o desenvolvimento e testes.
-- Os serviços abaixo são pré-definidos e estão vinculados à barbearia de id 1.
--
-- IMPORTANTE: Este arquivo é temporário. Futuramente será substituído pelo
-- CRUD de serviços na dashboard da barbearia, onde cada barbearia poderá
-- cadastrar, editar e desativar seus próprios serviços.
-- =============================================================================

-- ─── Serviços ────────────────────────────────────────────────
INSERT INTO servico (barbearia_id, nome, duracao_min, preco) VALUES
(1, 'Corte de cabelo', 30, 35.00),
(1, 'Barba',           30, 25.00),
(1, 'Corte + Barba',   60, 55.00),
(1, 'Pigmentação',     60, 80.00),
(1, 'Sobrancelha',     30, 15.00);

-- ─── Horário de funcionamento da barbearia ───────────────────
-- 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab

-- ─── Horário de trabalho dos barbeiros ───────────────────────
-- João (id=1): seg-sex 09h-17h
INSERT INTO horario_barbeiro (barbeiro_id, dia_semana, hora_inicio, hora_fim) VALUES
(1, 1, '09:00', '17:00'),
(1, 2, '09:00', '17:00'),
(1, 3, '09:00', '17:00'),
(1, 4, '09:00', '17:00'),
(1, 5, '09:00', '17:00');

-- Pedro (id=2): seg-sab 10h-18h
INSERT INTO horario_barbeiro (barbeiro_id, dia_semana, hora_inicio, hora_fim) VALUES
(2, 1, '10:00', '18:00'),
(2, 2, '10:00', '18:00'),
(2, 3, '10:00', '18:00'),
(2, 4, '10:00', '18:00'),
(2, 5, '10:00', '18:00'),
(2, 6, '10:00', '16:00');

-- ─── Agendamentos de exemplo ─────────────────────────────────
-- Hoje
INSERT INTO agendamento (barbearia_id, cliente_id, barbeiro_id, servico_id, horario, status) VALUES
(1, 1, 1, 1, CONCAT(CURDATE(), ' 09:00:00'), 'concluido'),
(1, 2, 2, 2, CONCAT(CURDATE(), ' 10:00:00'), 'concluido'),
(1, 2, 1, 3, CONCAT(CURDATE(), ' 14:00:00'), 'confirmado'),
(1, 1, 2, 1, CONCAT(CURDATE(), ' 15:30:00'), 'confirmado');

-- Amanhã
INSERT INTO agendamento (barbearia_id, cliente_id, barbeiro_id, servico_id, horario, status) VALUES
(1, 1, 1, 5, CONCAT(DATE_ADD(CURDATE(), INTERVAL 1 DAY), ' 09:00:00'), 'confirmado'),
(1, 2, 2, 3, CONCAT(DATE_ADD(CURDATE(), INTERVAL 1 DAY), ' 10:30:00'), 'confirmado'),
(1, 2, 1, 2, CONCAT(DATE_ADD(CURDATE(), INTERVAL 1 DAY), ' 11:30:00'), 'confirmado');

-- Em 2 dias
INSERT INTO agendamento (barbearia_id, cliente_id, barbeiro_id, servico_id, horario, status) VALUES
(1, 1, 2, 4, CONCAT(DATE_ADD(CURDATE(), INTERVAL 2 DAY), ' 14:00:00'), 'confirmado');