const asynchandler = require("express-async-handler");
const contactService = require("../services/contactService");
exports.createContact = asynchandler(async (req, res) => {
  const userAdd = req.user.id;
  const contact = req.body;
  const createdContact = await contactService.createContact(contact, userAdd,req.scope);
  res.locals.newContactId = createdContact.contact_id; // Store the new contact ID for audit logging
  req.audit = { newValues: createdContact }; // Store new values for audit logging
  res.status(201).json({data: createdContact, message: "Contact created successfully" });
});
exports.getContacts = asynchandler(async (req, res) => {
  const contacts = await contactService.getContacts(req.scope);
  res.json({data: contacts, message: "Contacts retrieved successfully" });
});
exports.getContactById = asynchandler(async (req, res) => {
  const id = req.params.id;
  const contact = await contactService.getContactById(id, req.scope);
  res.json({data: contact, message: "Contact retrieved successfully" });
});
exports.updateContact = asynchandler(async (req, res) => {
  const id = req.params.id;
  const contact = req.body;
  const userUpdate = req.user.id;
  const updatedContact = await contactService.updateContact(id, contact, userUpdate, req.scope);
  req.audit={newValues: updatedContact}; // Store new values for audit logging
  res.json({data: updatedContact, message: "Contact updated successfully" });
});
exports.deleteContact = asynchandler(async (req, res) => {
  const id = req.params.id;
  const userDelete = req.user.id;
  const deletedContact = await contactService.deleteContact(id, userDelete, req.scope);
  res.json({data: deletedContact, message: "Contact deleted successfully" });
});