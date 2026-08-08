-- Registro de push recebido no dispositivo (diagnóstico de notificações)
CREATE TABLE IF NOT EXISTS push_received_log (
  id BIGSERIAL PRIMARY KEY,
  endpoint_tail TEXT NOT NULL,
  received_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_received_log_received_at ON push_received_log(received_at);
