-- ============================================================================
-- 029_cron_secret.sql
-- Troca o segredo do cron para um CRON_SECRET dedicado (privilégio mínimo),
-- em vez de usar a service role key. Valor fica no Vault (criado via SQL
-- editor, sem expor segredo neste repositório) e na env var da função.
-- ============================================================================

select cron.unschedule('send-daily-reminder-hourly')
where exists (select 1 from cron.job where jobname = 'send-daily-reminder-hourly');

select cron.schedule(
  'send-daily-reminder-hourly',
  '0 * * * *',
  $$
  select
    net.http_post(
      url := 'https://lbgztfqgzjmiwvcghnki.supabase.co/functions/v1/send-daily-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', concat('Bearer ', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      body := '{}'
    ) as content_id;
  $$
);
