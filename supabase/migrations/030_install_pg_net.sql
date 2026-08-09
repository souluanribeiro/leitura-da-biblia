-- ============================================================================
-- 030_install_pg_net.sql
-- Instala o pg_net, extensão usada pelo cron (net.http_post) para chamar a
-- edge function send-daily-reminder. Sem ela, o job falha toda hora com
-- "schema net does not exist".
-- ============================================================================

create extension if not exists pg_net;
