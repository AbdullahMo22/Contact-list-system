const departmentModel = require('../models/departmentsModels');
const ApiError = require('../utils/ApiError');

exports.createDepartment = async (department_name, userAdd) => {
    if (!department_name || !userAdd) {
        throw new ApiError('Missing required fields', 400);
    }

    const exists = await departmentModel.existsDepartment(department_name, null);
    if (exists) {
        throw new ApiError('Department with this name already exists', 409);
    }

    const departmentId = await departmentModel.createDepartment(department_name, userAdd);
    // Fetch without scope – the creator always sees the newly created row
    const createdRow = await departmentModel.getDepartmentById(departmentId, null);
    return createdRow;
}

exports.getDepartments = async (scope) => {
    return departmentModel.getDepartments(scope);
}

exports.getDepartmentById = async (id, scope) => {
    if (!id) throw new ApiError('Missing required fields', 400);

    const department = await departmentModel.getDepartmentById(id, scope);
    if (!department) throw new ApiError('Department not found', 404);
    return department;
}

exports.updateDepartment = async (id, department_name, userUpdate, scope) => {
    if (!id) throw new ApiError('Missing required fields', 400);

    const existingDepartment = await departmentModel.getDepartmentById(id, scope);
    if (!existingDepartment) throw new ApiError('Department not found', 404);

    if (department_name) {
        const nameExists = await departmentModel.existsDepartment(department_name, id);
        if (nameExists) {
            throw new ApiError('Department with this name already exists', 409);
        }
    }

    const isUpdated = await departmentModel.updateDepartment(id, department_name, userUpdate, scope);
    if (!isUpdated) throw new ApiError('Department not found or no fields to update', 404);

    return departmentModel.getDepartmentById(id, scope);
}

exports.deleteDepartment = async (id, userDelete, scope) => {
    if (!id || !userDelete) throw new ApiError('Missing required fields', 400);

    const existingDepartment = await departmentModel.getDepartmentById(id, scope);
    if (!existingDepartment) throw new ApiError('Department not found', 404);

    const isDeleted = await departmentModel.deleteDepartment(id, userDelete, scope);
    if (!isDeleted) throw new ApiError('Department not found', 404);
    return true;
}

exports.getOldDepartmentById = async (id, scope) => departmentModel.getOldDepartmentById(id, scope);

exports.toggleDeptActive = async (id, userUpdate, scope) => {
    const dept = await departmentModel.getDepartmentById(id, scope);
    if (!dept) throw new ApiError('Department not found', 404);
    await departmentModel.toggleDeptActive(id, userUpdate);
    return departmentModel.getDepartmentById(id, scope);
}