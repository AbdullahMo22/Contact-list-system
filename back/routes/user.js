const express = require('express');
const router = express.Router();

const userCon = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { requirePerm } = require('../middleware/requirePerm');
const { auditLogger } = require('../middleware/auditMiddleware');

// CREATE USER
router.post('/',
  protect,
  requirePerm('USER_CREATE'),
  auditLogger({
    action_name: 'USER_CREATE',
    entity_type: 'USER',
    getEntityId: (req, res) => res.locals.newUserId
  }),
  userCon.createUser
);

// UPDATE USER
router.put('/:userId',
  protect,
  requirePerm('USER_EDIT'),
  auditLogger({
    action_name: 'USER_EDIT',
    entity_type: 'USER',
    getEntityId: (req) => req.params.userId
  }),
  userCon.updateUser
);

// DELETE USER
router.delete('/:userId',
  protect,
  requirePerm('USER_DELETE'),
  auditLogger({
    action_name: 'USER_DELETE',
    entity_type: 'USER',
    getEntityId: (req) => req.params.userId
  }),
  userCon.deleteUser
);

// GET USER BY ID
router.get('/:userId',
  protect,
  requirePerm('USER_VIEW'),
  userCon.getUserById
);

// GET ALL USERS
router.get('/',
  protect,
  requirePerm('USER_VIEW'),
  userCon.getAllUsers
);
router.patch('/:userId/toggle-active',
  protect,
  requirePerm('USER_EDIT'),
  auditLogger({
    action_name: 'TOGGLE_ACTIVE',
    entity_type: 'USER',
    getEntityId: (req) => req.params.userId
  }),
  userCon.disableUser
);

// ─── User Scope (Hotels & Departments) ────────────────────────────────────────

// GET  /users/:userId/scope
router.get('/:userId/scope',
  protect,
  requirePerm('USER_EDIT'),
  userCon.getUserScope
);

// PUT  /users/:userId/scope  — body: { hotelIds: number[], departmentIds: number[] }
router.put('/:userId/scope',
  protect,
  requirePerm('USER_EDIT'),
  auditLogger({
    action_name: 'USER_SCOPE_UPDATE',
    entity_type: 'USER',
    getEntityId: (req) => req.params.userId
  }),
  userCon.updateUserScope
);

module.exports = router;
