const ApiError = require("../utils/apiError");
const cardsModels = require("../models/cardsModels");

exports.createCard = async (card, scope) => {
  // ✅ تأكد إن contact ضمن scope قبل الإنشاء
  const ok = await cardsModels.contactInScope(Number(card.contact_id), scope);
  if (!ok) throw new ApiError("Forbidden: contact out of scope", 403);

  const cardId = await cardsModels.createCard(card);
  return cardId;
};

exports.getCards = async (scope) => {
  const cards = await cardsModels.getCards(scope);
  return cards;
};

exports.getCardById = async (id, scope) => {
  const card = await cardsModels.getCardById(id, scope);
  if (!card) throw new ApiError("Card not found", 404);
  return card;
};

exports.updateCard = async (id, card, scope) => {
  // ✅ تأكد إن الكارد ضمن scope قبل التحديث
  const can = await cardsModels.cardInScope(id, scope);
  if (!can) throw new ApiError("Forbidden: card out of scope", 403);

  // لو المستخدم بيغير contact_id لازم نراجع scope للـ contact الجديد
  if (card.contact_id !== undefined && card.contact_id !== null) {
    const ok = await cardsModels.contactInScope(Number(card.contact_id), scope);
    if (!ok) throw new ApiError("Forbidden: target contact out of scope", 403);
  }

  const updated = await cardsModels.updateCard(id, card);
  if (updated === null) throw new ApiError("Card not found", 404);
  return updated;
};

exports.deleteCard = async (id, userDelete, scope) => {
  // ✅ تأكد إن الكارد ضمن scope قبل الحذف
  const can = await cardsModels.cardInScope(id, scope);
  if (!can) throw new ApiError("Forbidden: card out of scope", 403);

  const deleted = await cardsModels.deleteCard(id, userDelete);
  if (deleted === null) throw new ApiError("Card not found", 404);
  return deleted;
};

exports.getCardsByContactId = async (contact_id, scope) => {
  // ✅ تأكد إن contact ضمن scope قبل list
  const ok = await cardsModels.contactInScope(Number(contact_id), scope);
  if (!ok) throw new ApiError("Forbidden: contact out of scope", 403);

  const cards = await cardsModels.getCardsByContactId(contact_id, scope);
  return cards;
};

exports.getOldCardById = async (id, scope) => {
  // ✅ حتى old values لازم تتقيد بالـ scope عشان متسربش بيانات
  const card = await cardsModels.getOldCardById(id, scope);
  return card;
};
