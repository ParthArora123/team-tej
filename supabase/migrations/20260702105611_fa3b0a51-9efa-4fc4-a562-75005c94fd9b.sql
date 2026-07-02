
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS sms_status TEXT,
  ADD COLUMN IF NOT EXISTS sms_message_id TEXT,
  ADD COLUMN IF NOT EXISTS sms_error TEXT,
  ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_status TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_error TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notification_provider TEXT;
