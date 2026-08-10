-- ============================================================================
-- 034_atomic_rate_limit_rpc.sql
-- Fecha a corrida no rate limit do Sheep (bible-agent): antes, a contagem e o
-- INSERT eram operações separadas, então 2 requests simultâneos passavam do
-- limite diário. Agora tudo roda em UMA transação com lock de sessão por
-- usuário: conta, verifica e insere atomicamente.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_user_message(
  p_user_id uuid,
  p_content text,
  p_user_email text,
  p_conversation_id uuid,
  p_daily_limit int,
  p_burst_limit int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_day_start timestamptz := date_trunc('day', now());
  v_minute_start timestamptz := now() - interval '1 minute';
  v_daily_count int;
  v_burst_count int;
  v_allowed boolean;
BEGIN
  -- Serializa requests do mesmo usuário: o segundo espera o primeiro terminar
  PERFORM pg_advisory_xact_lock(hashtext('agent_msg:' || p_user_id::text));

  SELECT count(*) INTO v_daily_count
  FROM public.chat_history
  WHERE user_id = p_user_id
    AND role = 'user'
    AND created_at >= v_day_start;

  SELECT count(*) INTO v_burst_count
  FROM public.chat_history
  WHERE user_id = p_user_id
    AND role = 'user'
    AND created_at >= v_minute_start;

  v_allowed := v_daily_count < p_daily_limit AND v_burst_count < p_burst_limit;

  IF v_allowed THEN
    INSERT INTO public.chat_history (user_id, role, content, user_email, conversation_id)
    VALUES (p_user_id, 'user', p_content, p_user_email, p_conversation_id);
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'daily_count', v_daily_count,
    'daily_limit', p_daily_limit,
    'burst_count', v_burst_count,
    'burst_limit', p_burst_limit
  );
END;
$$;

-- Executável apenas pela service role (edge function); usuário comum não precisa
REVOKE ALL ON FUNCTION public.log_user_message FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_user_message FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_user_message TO service_role;
