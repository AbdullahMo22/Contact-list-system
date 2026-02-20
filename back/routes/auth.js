const express=require('express');
const router =express.Router();
const {login,registerAdmin,updatePassword,GetAuditLogs,getMe}=require('../controllers/authController');
const {protect} = require('../middleware/authMiddleware');
const {attachScope}=require('../middleware/attachScope');
const {requirePerm}=require('../middleware/requirePerm');
router.get('/audit-logs',protect,attachScope,requirePerm('LOG_VIEW'),GetAuditLogs);
router.get('/me',protect,getMe);
router.post('/admin/register',registerAdmin);
router.post('/login',login);
router.put('/admin/update-password/:id',updatePassword);

module.exports=router;