UPDATE public.programs
SET session_schedule = jsonb_build_array(
  jsonb_build_object('name', 'Shiv Tandav', 'time', '16:00'),
  jsonb_build_object('name', 'Govind Bolo', 'time', '19:00')
)
WHERE id = '1abd383c-917e-4320-aa38-3e8b9891990f';