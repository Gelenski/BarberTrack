-- =============================================================================
-- seeds.sql
-- =============================================================================
-- Este arquivo contém dados iniciais para facilitar o desenvolvimento e testes.
-- Os serviços abaixo são pré-definidos e estão vinculados à barbearia de id 1.
--
-- IMPORTANTE: Este arquivo é temporário. Futuramente será substituído pelo
-- CRUD de serviços na dashboard da barbearia, onde cada barbearia poderá
-- cadastrar, editar e desativar seus próprios serviços.
--
-- Como usar:
--   mysql -u root -p barbertrack < db/seeds.sql
-- =============================================================================

INSERT INTO servico (barbearia_id, nome, duracao_min, preco) VALUES
(1, 'Corte de cabelo',   30, 35.00),
(1, 'Barba',             20, 25.00),
(1, 'Corte + Barba',     45, 55.00),
(1, 'Pigmentação',       60, 80.00),
(1, 'Sobrancelha',       15, 15.00),
(1, 'Hidratação',        40, 50.00),
(1, 'Relaxamento',       50, 65.00);