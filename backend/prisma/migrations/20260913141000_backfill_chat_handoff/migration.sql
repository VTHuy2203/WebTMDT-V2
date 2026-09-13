UPDATE "conversations" AS c
SET
  "automation_enabled" = false,
  "handoff_at" = COALESCE(
    c."handoff_at",
    (
      SELECT MIN(m."created_at")
      FROM "messages" AS m
      INNER JOIN "conversation_participants" AS cp
        ON cp."conversation_id" = m."conversation_id"
       AND cp."user_id" = m."sender_id"
       AND cp."role" = 'ADMIN'
      WHERE m."conversation_id" = c."id"
    )
  )
WHERE EXISTS (
  SELECT 1
  FROM "messages" AS m
  INNER JOIN "conversation_participants" AS cp
    ON cp."conversation_id" = m."conversation_id"
   AND cp."user_id" = m."sender_id"
   AND cp."role" = 'ADMIN'
  WHERE m."conversation_id" = c."id"
);
