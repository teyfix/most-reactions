SELECT m.id, m.content, IFNULL(r.count, 0) as count
FROM message_entity m
         LEFT JOIN (SELECT r.id, r.messageId, COUNT(DISTINCT r.userId) as count
                    FROM reaction_entity r
                    WHERE r.deletedAt IS NULL
                    GROUP BY r.messageId) r ON m.id = r.messageId
WHERE m.deletedAt IS NULL
  AND m.channelId = ?
ORDER BY r.count DESC, m.createdAt
