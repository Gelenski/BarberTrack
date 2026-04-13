async function recordExists(db, tableName, fieldName, fieldValue) {
  const [rows] = await db.execute(
    `SELECT id FROM ${tableName} WHERE ${fieldName} = ?`,
    [fieldValue]
  );

  return rows.length > 0;
}

module.exports = {
  recordExists,
};
