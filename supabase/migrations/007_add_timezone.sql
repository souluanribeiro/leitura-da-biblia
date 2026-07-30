-- Adiciona coluna timezone para cálculo correto de notificações por fuso horário
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo';

-- Preencher registros existentes com o fuso do Brasil como padrão
UPDATE push_subscriptions SET timezone = 'America/Sao_Paulo' WHERE timezone IS NULL;
