const ApiError = require('../utils/apiError');
const contactsModel = require('../models/contactsModels');

exports.updateContact=async(id,contact,userUpdate,scope)=>{
if(!id){
    throw new ApiError( 'Contact ID is required', 400);

}
const existingContact = await contactsModel.getContactById(id, scope);
if(!existingContact){
    throw new ApiError( 'Contact not found', 404);}
    contact.userUpdate=userUpdate;
    const ok=await contactsModel.updateContact(id,contact,scope);
    if(!ok){
        throw new ApiError( 'Failed to update contact', 500);
    }
    const updatedRow=await contactsModel.getContactById(id,scope);
    return updatedRow;

};
exports.createContact=async(contact,userAdd,scope)=>{
    if(!contact.full_name || !contact.email || !contact.phone || !contact.hotel_id || !contact.department_id || !contact.job_title){
        throw new ApiError( 'Missing required fields', 400);
    }
    contact.userAdd=userAdd;
    const hotelOk=!scope?true:(scope.hotelIds||[]).includes(Number(contact.hotel_id));
    const deptOk=!scope?true:(scope.departmentIds||[]).includes(Number(contact.department_id));
    if(!hotelOk || !deptOk){
        throw new ApiError( 'Forbidden, insufficient scope', 403);
    }
    const insertId=await contactsModel.createContact(contact,scope);
    if(!insertId){
        throw new ApiError( 'Failed to create contact', 500);
    }
    const createdRow=await contactsModel.getContactById(insertId,scope);
    return createdRow   ;
};
exports.getContacts=async(scope)=>{
    return await contactsModel.getContacts(scope);
};
exports.getContactById=async(id,scope)=>{
    if(!id){
        throw new ApiError( 'Contact ID is required', 400);
    }
    const contact=await contactsModel.getContactById(id,scope);
    if(!contact){
        throw new ApiError( 'Contact not found', 404);
    }
    return contact;
};
exports.deleteContact=async(id,userDelete,scope)=>{
    if(!id || !userDelete){
        throw new ApiError( 'Contact ID and user performing delete are required', 400);
    }

    const existingContact = await contactsModel.getContactById(id, scope);
    if(!existingContact){
        throw new ApiError( 'Contact not found', 404);
    }
    const deleted=await contactsModel.deleteContact(id,userDelete,scope);
    if(!deleted){
        throw new ApiError( 'Failed to delete contact', 500);
    }
    return deleted;
};

exports.getOldContactById = async (id, scope) => await contactsModel.getOldContactById(id, scope);