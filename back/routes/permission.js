const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { protect } = require('../middleware/authMiddleware');
const { requirePerm } = require('../middleware/requirePerm');

// GET all permissions
router.get('/', protect, requirePerm('ROLE_MANAGE'), permissionController.getAllPermissions);

// GET single permission
router.get('/:permId', protect, requirePerm('ROLE_MANAGE'), async (req, res, next) => {
    try {
        const service = require('../services/pemissionService');
        const perm = await service.getPermissionById(req.params.permId);
        res.json({ data: perm });
    } catch (err) { next(err); }
});

// POST create
router.post('/', protect, requirePerm('ROLE_MANAGE'), permissionController.createPermission);

// PUT update
router.put('/:permId', protect, requirePerm('ROLE_MANAGE'), permissionController.updatePermission);

// DELETE
router.delete('/:permId', protect, requirePerm('ROLE_MANAGE'), permissionController.deletePermission);

module.exports = router;
