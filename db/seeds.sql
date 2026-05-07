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

INSERT INTO servico (barbearia_id, nome, duracao_min, preco) VALUES
(1, 'Corte de cabelo',   30, 35.00),
(1, 'Barba',             20, 25.00),
(1, 'Corte + Barba',     45, 55.00),
(1, 'Pigmentação',       60, 80.00),
(1, 'Sobrancelha',       15, 15.00),
(1, 'Hidratação',        40, 50.00),
(1, 'Relaxamento',       50, 65.00);

-- -----------------------------------------------------------------------------
-- Horário de funcionamento da barbearia
-- 1=segunda, 2=terça, 3=quarta, 4=quinta, 5=sexta, 6=sábado
-- -----------------------------------------------------------------------------
INSERT INTO horario_barbearia (barbearia_id, dia_semana, hora_abertura, hora_fechamento) VALUES
(1, 1, '09:00', '18:00'),
(1, 2, '09:00', '18:00'),
(1, 3, '09:00', '18:00'),
(1, 4, '09:00', '18:00'),
(1, 5, '09:00', '18:00'),
(1, 6, '09:00', '16:00');
 
-- -----------------------------------------------------------------------------
-- Horário de trabalho do barbeiro
-- Barbeiro 1 trabalha seg-sex, 9h às 17h
-- -----------------------------------------------------------------------------
INSERT INTO horario_barbeiro (barbeiro_id, dia_semana, hora_inicio, hora_fim) VALUES
(1, 1, '09:00', '17:00'),
(1, 2, '09:00', '17:00'),
(1, 3, '09:00', '17:00'),
(1, 4, '09:00', '17:00'),
(1, 5, '09:00', '17:00');