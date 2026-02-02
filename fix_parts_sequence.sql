-- Fix the sequence for parts table ID
-- First check the sequence name
SELECT pg_get_serial_sequence('parts', 'id');

-- Then fix it (replace 'parts_id_seq' with the actual sequence name if different)
SELECT setval(pg_get_serial_sequence('parts', 'id'), (SELECT MAX(id) FROM parts) + 1);

-- Alternative if the above doesn't work:
-- SELECT setval('public.parts_id_seq', (SELECT MAX(id) FROM parts) + 1);