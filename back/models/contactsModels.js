const pool=require('../config/db');
const {buildScopeWhere}=require('../utils/scopeSql');

exports.createContact=async(contact)=>{
const {full_name,email,phone,hotel_id,department_id,job_title,notes,userAdd}=contact;
const sql=`
INSERT INTO contacts (full_name,email,phone,hotel_id,department_id,job_title,notes,userAdd)
VALUES (?,?,?,?,?,?,?,?) ;
`;
const values=[full_name,email,phone,hotel_id,department_id,job_title,notes,userAdd];
const [rows]=await pool.query(sql,values);
return rows.insertId;
}
exports.getContacts=async(scope)=>{
    const scopeWhere = buildScopeWhere(scope,{
        hotelField:"hotel_id",
        deptField:"department_id",
        joinAlias:"c"
    })
const sql=`
SELECT c.*,
  h.hotel_name,
  d.department_name
FROM contacts c
LEFT JOIN hotels h ON c.hotel_id = h.hotel_id
LEFT JOIN departments d ON c.department_id = d.department_id
WHERE c.is_deleted=0 AND c.is_active=1
${scopeWhere.sql}
ORDER BY c.contact_id DESC;
`;
const [rows]=await pool.query(sql,scopeWhere.params);
return rows;
}
exports.getContactsByScope=async(scope)=>{
    // نفس getContacts بس مع alias للـ joins لو استخدم الراوتر join مع جداول تانية
    return exports.getContacts(scope);
};
exports.getContactById=async(id,scope)=>{
    const scopeWhere = buildScopeWhere(scope,{
        hotelField:"hotel_id",
        deptField:"department_id",
        joinAlias:"c"
    })
const sql=`
SELECT c.*,
  h.hotel_name,
  d.department_name
FROM contacts c
LEFT JOIN hotels h ON c.hotel_id = h.hotel_id
LEFT JOIN departments d ON c.department_id = d.department_id
WHERE c.contact_id=? AND c.is_deleted=0 AND c.is_active=1
${scopeWhere.sql}
`;
const [rows]=await pool.query(sql,[id,...scopeWhere.params]);
return rows[0];
}
exports.updateContact=async(id,contact,scope)=>{
    const scopeWhere = buildScopeWhere(scope,{
        hotelField:"hotel_id",
        deptField:"department_id"
    });
    const {full_name,email,phone,hotel_id,department_id,job_title,notes,userUpdate}=contact;
    const fields=[];
    const values=[];
    if(full_name !== undefined){
        fields.push('full_name=?');
        values.push(full_name);
    }
    if(email !== undefined){
        fields.push('email=?');
        values.push(email);
    }
    if(phone !== undefined){
        fields.push('phone=?');
        values.push(phone);
    }
    if(hotel_id !== undefined){
        fields.push('hotel_id=?');
        values.push(hotel_id);
    }
    if(department_id !== undefined){
        fields.push('department_id=?');
        values.push(department_id);
    }
    if(job_title !== undefined){
        fields.push('job_title=?');
        values.push(job_title);
    }
    if(notes !== undefined){
        fields.push('notes=?');
        values.push(notes);
    }
    if(userUpdate !== undefined){
        fields.push('userUpdate=? , updated_at=NOW()');
        values.push(userUpdate);
    }
    if(fields.length===0){
        throw new Error('No fields to update');
    }
    const sql=`UPDATE contacts SET ${fields.join(',')} WHERE contact_id=? 
    and is_deleted=0 and is_active=1  ${scopeWhere.sql};
    `;
    values.push(id,...scopeWhere.params);
    const [result]=await pool.query(sql,values);
    if (result.affectedRows === 0) return null;

    return result.affectedRows > 0;
};

exports.deleteContact=async(id,userDelete,scope)=>{
    const scopeWhere = buildScopeWhere(scope,{
        hotelField:"hotel_id",
        deptField:"department_id"
    });
    const sql=`UPDATE contacts SET is_deleted=1, userDelete=?,
     deleted_at=NOW() WHERE contact_id=? and is_active=1
     ${scopeWhere.sql};
    `;
    const [result]=await pool.query(sql,[userDelete,id,...scopeWhere.params]);
       if (result.affectedRows === 0) return null;
    
    return true;
};

exports.getOldContactById=async(id , scope)=>{
    const scopeWhere =buildScopeWhere(scope,
        {hotelField:"hotel_id",
        deptField:"department_id"
    });
    const sql=`SELECT * FROM contacts WHERE contact_id=? ${scopeWhere.sql}`;
    const [rows]=await pool.query(sql,[id,...scopeWhere.params]);
    return rows[0];
}