const pool = require("../config/db");

// Helper: build SQL filters for scope
function buildScopeSql(scope, params) {
  if (!scope) return ""; // admin: no filters

  const { hotelIds = [], departmentIds = [] } = scope;

  // لو مفيش assignments، اقفل كل النتائج
  if (!hotelIds.length && !departmentIds.length) return " AND 1=0 ";

  let sql = "";

  if (hotelIds.length) {
    sql += ` AND ct.hotel_id IN (${hotelIds.map(() => "?").join(",")}) `;
    params.push(...hotelIds);
  }

  if (departmentIds.length) {
    sql += ` AND ct.department_id IN (${departmentIds.map(() => "?").join(",")}) `;
    params.push(...departmentIds);
  }

  return sql;
}

// ✅ check: contact in scope
exports.contactInScope = async (contact_id, scope) => {
  const params = [contact_id];
  let sql = `
    SELECT 1
    FROM contacts ct
    WHERE ct.contact_id = ?
  `;
  sql += buildScopeSql(scope, params);

  const [rows] = await pool.query(sql, params);
  return rows.length > 0;
};

// ✅ check: card in scope (via contact)
exports.cardInScope = async (card_id, scope) => {
  const params = [card_id];
  let sql = `
    SELECT 1
    FROM cards c
    JOIN contacts ct ON ct.contact_id = c.contact_id
    WHERE c.card_id = ?
      AND c.is_deleted = 0
      AND c.is_active = 1
  `;
  sql += buildScopeSql(scope, params);

  const [rows] = await pool.query(sql, params);
  return rows.length > 0;
};

exports.createCard = async (card) => {
  const { contact_id, card_number, card_type, status, issued_at, expires_at, userAdd } = card;

  const query = `
    INSERT INTO cards (contact_id, card_number, card_type, status, issued_at, expires_at, userAdd)
    VALUES (?,?,?,?,?,?,?)
  `;
  const values = [contact_id, card_number, card_type, status, issued_at, expires_at, userAdd];

  const [result] = await pool.query(query, values);
  return result.insertId;
};

exports.updateCard = async (id, card) => {
  const { contact_id, card_number, card_type, status, issued_at, expires_at, userUpdate } = card;

  const fields = [];
  const values = [];

  if (contact_id !== undefined) { fields.push("contact_id=?"); values.push(contact_id); }
  if (card_number !== undefined) { fields.push("card_number=?"); values.push(card_number); }
  if (card_type !== undefined) { fields.push("card_type=?"); values.push(card_type); }
  if (status !== undefined) { fields.push("status=?"); values.push(status); }
  if (issued_at !== undefined) { fields.push("issued_at=?"); values.push(issued_at); }
  if (expires_at !== undefined) { fields.push("expires_at=?"); values.push(expires_at); }
  if (userUpdate !== undefined) { fields.push("userUpdate=?"); values.push(userUpdate); }

  if (!fields.length) throw new Error("No fields to update");

  const sql = `UPDATE cards SET ${fields.join(", ")} WHERE card_id=? AND is_deleted=0`;
  values.push(id);

  const [result] = await pool.query(sql, values);
  if (result.affectedRows === 0) return null;
  return true;
};

exports.getCards = async (scope) => {
  const params = [];
  let sql = `
    SELECT c.*
    FROM cards c
    JOIN contacts ct ON ct.contact_id = c.contact_id
    WHERE c.is_deleted=0 AND c.is_active=1
  `;
  sql += buildScopeSql(scope, params);
  sql += " ORDER BY c.card_id DESC";

  const [rows] = await pool.query(sql, params);
  return rows;
};

exports.getCardById = async (id, scope) => {
  const params = [id];
  let sql = `
    SELECT c.*
    FROM cards c
    JOIN contacts ct ON ct.contact_id = c.contact_id
    WHERE c.card_id=?
      AND c.is_deleted=0
      AND c.is_active=1
  `;
  sql += buildScopeSql(scope, params);

  const [rows] = await pool.query(sql, params);
  return rows[0];
};

exports.deleteCard = async (id, userDelete) => {
  const sql = `
    UPDATE cards
    SET is_deleted=1, userDelete=?, deleted_at=NOW()
    WHERE card_id=? AND is_deleted=0 AND is_active=1
  `;
  const [result] = await pool.query(sql, [userDelete, id]);
  if (result.affectedRows === 0) return null;
  return result.affectedRows > 0;
};

exports.getCardsByContactId = async (contact_id, scope) => {
  const params = [contact_id];
  let sql = `
    SELECT c.*
    FROM cards c
    JOIN contacts ct ON ct.contact_id = c.contact_id
    WHERE c.contact_id=?
      AND c.is_deleted=0
      AND c.is_active=1
  `;
  sql += buildScopeSql(scope, params);
  sql += " ORDER BY c.card_id DESC";

  const [rows] = await pool.query(sql, params);
  return rows;
};

// ✅ Old card values but still scoped
exports.getOldCardById = async (id, scope) => {
  const params = [id];
  let sql = `
    SELECT c.*
    FROM cards c
    JOIN contacts ct ON ct.contact_id = c.contact_id
    WHERE c.card_id=?
  `;
  sql += buildScopeSql(scope, params);

  const [rows] = await pool.query(sql, params);
  return rows[0];
};
