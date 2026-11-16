const db = require("../db");

const insertAudit = db.prepare(
  `INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after)
   VALUES (?, ?, ?, ?, ?, ?)`
);

const audit = ({ actorId, action, entity, entityId, before = null, after = null }) => {
  insertAudit.run(
    actorId ?? null,
    action,
    entity,
    entityId != null ? String(entityId) : null,
    before ? JSON.stringify(before) : null,
    after ? JSON.stringify(after) : null
  );
};

module.exports = { audit };
