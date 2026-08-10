-- ============================================================================
-- 033_send_scheduled_notifications_cron.sql
-- Processa notificações agendadas (scheduled_at <= now, status pending).
-- Roda de 5 em 5 minutos e chama a edge function send-scheduled-notifications
-- autenticada com o CRON_SECRET do Vault (mesmo segredo da 029).
-- ============================================================================

select cron.unschedule('send-scheduled-notifications')
where exists (select 1 from cron.job where jobname = 'send-scheduled-notifications');

select cron.schedule(
  'send-scheduled-notifications',
  '*/5 * * * *',
  $$
  select
    net.http_post(
      url := 'https://lbgztfqgzjmiwvcghnki.supabase.co/functions/v1/send-scheduled-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', concat('Bearer ', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      body := '{}'
    ) as content_id;
  $$
);
