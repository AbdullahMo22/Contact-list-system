const pool=require('../config/db');

exports.getUserScope=async(userId)=>{
    const [hotels]=await pool.query(`
        select hotel_id from user_hotels where user_id=?`,[userId]);
        const [departments]=await pool.query(`
            select department_id from user_departments where user_id=?`,[userId]);
            return {
                hotelIds:hotels.map(h=>h.hotel_id),
                departmentIds:departments.map(d=>d.department_id)
            };

};