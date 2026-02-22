exports.buildScopeWhere = (scope, { hotelField = "hotel_id", deptField = "department_id", joinAlias = "" } = {}) => {
  // admin => no scope
  if (!scope) return { sql: "", params: [] };

  const hotelIds = scope.hotelIds || [];
  const departmentIds = scope.departmentIds || [];

   if (hotelIds.length === 0 && departmentIds.length === 0) {
    return { sql: " AND 1=0 ", params: [] };
  }

  const prefix = joinAlias ? `${joinAlias}.` : "";

  const parts = [];
  const params = [];

  if (hotelIds.length) {
    parts.push(`${prefix}${hotelField} IN (${hotelIds.map(() => "?").join(",")})`);
    params.push(...hotelIds);
  }
  if (departmentIds.length) {
    parts.push(`${prefix}${deptField} IN (${departmentIds.map(() => "?").join(",")})`);
    params.push(...departmentIds);
  }

  return { sql: ` AND (${parts.join(" AND ")}) `, params };
};

 
exports.buildHotelScopeWhere = (scope, { field = "hotel_id", joinAlias = "" } = {}) => {
  if (!scope) return { sql: "", params: [] };

  const hotelIds = scope.hotelIds || [];
  if (hotelIds.length === 0) {
    return { sql: " AND 1=0 ", params: [] };
  }

  const prefix = joinAlias ? `${joinAlias}.` : "";
  return {
    sql: ` AND ${prefix}${field} IN (${hotelIds.map(() => "?").join(",")}) `,
    params: [...hotelIds],
  };
};
