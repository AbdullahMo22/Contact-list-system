const departmentService = require('../services/departmentService');
const asynchandler = require('express-async-handler');

exports.createDepartment = asynchandler(async (req, res) => {
    const { department_name } = req.body;
    const userAdd = req.user.id;
    
    const createdDepartment = await departmentService.createDepartment(department_name, userAdd);
    res.locals.newDepartmentId = createdDepartment.department_id;
    req.audit = { newValues: createdDepartment };
    
    res.status(201).json({ 
        data: createdDepartment,
        message: 'Department created successfully' 
    });
});

exports.getDepartments = asynchandler(async (req, res) => {
    const departments = await departmentService.getDepartments(req.scope);
    res.status(200).json({ 
        data: departments,
        message: 'Departments retrieved successfully'
    });
});

exports.getDepartmentById = asynchandler(async (req, res) => {
    const { id } = req.params;
    const department = await departmentService.getDepartmentById(id, req.scope);
    res.status(200).json({ 
        data: department,
        message: 'Department retrieved successfully'
    });
});

exports.updateDepartment = asynchandler(async (req, res) => {
    const { id } = req.params;
    const { department_name } = req.body;
    const userUpdate = req.user.id;
    
    const updatedDepartment = await departmentService.updateDepartment(id, department_name, userUpdate, req.scope);
    req.audit = { newValues: updatedDepartment };
    
    res.status(200).json({ 
        data: updatedDepartment,
        message: 'Department updated successfully'
    });
});

exports.deleteDepartment = asynchandler(async (req, res) => {
    const { id } = req.params;
    const userDelete = req.user.id;
    
    const deleted = await departmentService.deleteDepartment(id, userDelete, req.scope);
    res.status(200).json({ 
        data: { id },
        message: 'Department deleted successfully'
    });
});

exports.toggleDeptActive = asynchandler(async (req, res) => {
    const { id } = req.params;
    const userUpdate = req.user.id;
    const updated = await departmentService.toggleDeptActive(id, userUpdate, req.scope);
            req.audit = { newValues: updated };

    res.status(200).json({
        data: updated,
        message: `Department ${updated.is_active ? 'activated' : 'deactivated'} successfully`
    });
});