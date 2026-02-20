const departmentModel = require('../models/departmentsModels');
const ApiError = require('../utils/ApiError');

exports.createDepartment = async (hotel_id, department_name, userAdd, scope) => {
    if (!hotel_id || !department_name || !userAdd) {
        throw new ApiError('Missing required fields', 400);
    }
    
    // Scope check for hotel_id
    const hotelOk = !scope ? true : (scope.hotelIds || []).includes(Number(hotel_id));
    if (!hotelOk) {
        throw new ApiError('Forbidden, insufficient scope for hotel', 403);
    }

    const departmentId = await departmentModel.createDepartment(hotel_id, department_name, userAdd);
    const createdRow = await departmentModel.getDepartmentById(departmentId, scope);
    return createdRow;
}

exports.getDepartments = async (scope) => {
    const departments = await departmentModel.getDepartments(scope);
    return departments;
}

exports.getDepartmentById = async (id, scope) => {
    if (!id) {
        throw new ApiError('Missing required fields', 400);
    }

    const department = await departmentModel.getDepartmentById(id, scope);
    if (!department) {
        throw new ApiError('Department not found', 404);
    }
    return department;
}

exports.updateDepartment = async (id, hotel_id, department_name, userUpdate, scope) => {
    if (!id) {
        throw new ApiError('Missing required fields', 400);
    }

    const existingDepartment = await departmentModel.getDepartmentById(id, scope);
    if (!existingDepartment) {
        throw new ApiError('Department not found', 404);
    }

    // Check scope for new hotel_id if provided
    if (hotel_id) {
        const hotelOk = !scope ? true : (scope.hotelIds || []).includes(Number(hotel_id));
        if (!hotelOk) {
            throw new ApiError('Forbidden, insufficient scope for hotel', 403);
        }
    }

    const departmentExists = await departmentModel.existsDepartment(hotel_id, department_name, id);
    if (departmentExists) {
        throw new ApiError('Department with the same name already exists in this hotel', 409);
    }

    const isUpdated = await departmentModel.updateDepartment(id, hotel_id, department_name, userUpdate, scope);
    if (!isUpdated) {
        throw new ApiError('Department not found or no fields to update', 404);
    }
    
    const updatedRow = await departmentModel.getDepartmentById(id, scope);
    return updatedRow;
}

exports.deleteDepartment = async (id, userDelete, scope) => {
    if (!id || !userDelete) {
        throw new ApiError('Missing required fields', 400);
    }

    const existingDepartment = await departmentModel.getDepartmentById(id, scope);
    if (!existingDepartment) {
        throw new ApiError('Department not found', 404);
    }

    const isDeleted = await departmentModel.deleteDepartment(id, userDelete, scope);
    if (!isDeleted) {
        throw new ApiError('Department not found', 404);
    }
    return true;
}

exports.getOldDepartmentById = async (id, scope) => await departmentModel.getOldDepartmentById(id, scope);

exports.toggleDeptActive = async (id, userUpdate, scope) => {
    const dept = await departmentModel.getDepartmentById(id, scope);
    if (!dept) throw new ApiError('Department not found', 404);
    await departmentModel.toggleDeptActive(id, userUpdate);
    return await departmentModel.getDepartmentById(id, scope);
}