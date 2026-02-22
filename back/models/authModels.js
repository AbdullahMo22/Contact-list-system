const pool=require('../config/db');

exports.findUserById=async (id)=>{
    const [rows]=await pool.query("select * from users where user_id=?",[id]);
    return rows[0];
};
exports.findUserByUsername=async (username)=>{
    const [rows]=await pool.query("select * from users where username=? and is_active=1",[username]);
    return rows[0];
};
 
exports.createUser=async (username,password_hash,full_name,email,userAdd)=>{
    const [result]=
    await pool.query("insert into users(username,password_hash,full_name,email,userAdd) values(?,?,?,?,?)"
    ,[username,password_hash,full_name,email,userAdd]);
    return result.insertId;
}