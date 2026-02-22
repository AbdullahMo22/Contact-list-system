const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const departmentService = require('../services/departmentService');
const { createDepartmentValidator, 
    getDepartmentByIdValidator, 
    updateDepartmentValidator, 
    deleteDepartmentValidator } = require('../utils/validators/departmentValidators');
const { auditLogger } = require('../middleware/auditMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { attachScope } = require('../middleware/attachScope');
const { requirePerm } = require('../middleware/requirePerm');

router.patch('/:id/toggle-active',
    protect,
    requirePerm('DEPARTMENT_EDIT'),
    attachScope,
        auditLogger({
        action_name: 'DEPARTMENT_EDIT',
        entity_type: 'DEPARTMENT',
        getEntityId: (req) => req.params.id,
        getOldValues: async (req) => await departmentService.getOldDepartmentById(Number(req.params.id), req.scope)
    }),
    departmentController.toggleDeptActive
);

router.post('/', 
    protect,
    requirePerm('DEPARTMENT_CREATE'),
    attachScope,
    createDepartmentValidator,
    auditLogger({
        action_name: 'DEPARTMENT_CREATE',
        entity_type: 'DEPARTMENT',
        getEntityId: (req, res) => res.locals.newDepartmentId,
    }),
    departmentController.createDepartment
);

router.get('/', 
    protect,
    requirePerm('DEPARTMENT_VIEW','CONTACT_VIEW', 'CONTACT_CREATE', 'CONTACT_EDIT'),
    attachScope,
    departmentController.getDepartments
);

router.get('/:id', 
    protect, 
    requirePerm('DEPARTMENT_VIEW','CONTACT_VIEW', 'CONTACT_CREATE', 'CONTACT_EDIT'), 
    attachScope, 
    getDepartmentByIdValidator, 
    departmentController.getDepartmentById
);

router.put('/:id', 
    protect, 
    requirePerm('DEPARTMENT_EDIT'), 
    attachScope, 
    updateDepartmentValidator, 
    auditLogger({
        action_name: 'DEPARTMENT_EDIT',
        entity_type: 'DEPARTMENT',
        getEntityId: (req) => req.params.id,
        getOldValues: async (req) => await departmentService.getOldDepartmentById(Number(req.params.id), req.scope)
    }),
    departmentController.updateDepartment
);

router.delete('/:id', 
    protect, 
    requirePerm('DEPARTMENT_DELETE'), 
    attachScope, 
    deleteDepartmentValidator,
    auditLogger({
        action_name: 'DEPARTMENT_DELETE',
        entity_type: 'DEPARTMENT',
        getEntityId: (req) => req.params.id,
        getOldValues: async (req) => await departmentService.getOldDepartmentById(Number(req.params.id), req.scope)
    }),
    departmentController.deleteDepartment
);

module.exports = router;