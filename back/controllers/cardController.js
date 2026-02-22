const asynchandler = require("express-async-handler");
const cardService = require("../services/cardService");

exports.createCard = asynchandler(async (req, res) => {
  const payload = {
    contact_id: req.body.contact_id,
    card_number: req.body.card_number,
    card_type: req.body.card_type,
    status: req.body.status,
    issued_at: req.body.issued_at,
    expires_at: req.body.expires_at,
    userAdd: req.user?.user_id ?? req.user?.id ?? null,
  };

  const cardId = await cardService.createCard(payload, req.scope);

  res.locals.newCardId = cardId;
  req.audit = { newValues: { card_id: cardId, ...payload } };

  res.status(201).json({ message: "Card created successfully", cardId });
});

exports.updateCard = asynchandler(async (req, res) => {
  const id = Number(req.params.id);

  const payload = {
    contact_id: req.body.contact_id,
    card_number: req.body.card_number,
    card_type: req.body.card_type,
    status: req.body.status,
    issued_at: req.body.issued_at,
    expires_at: req.body.expires_at,
    userUpdate: req.user?.user_id ?? req.user?.id ?? null,
  };

  await cardService.updateCard(id, payload, req.scope);

  // بعد التحديث: نخزن newValues للـ audit
  const updatedRow = await cardService.getCardById(id, req.scope);
  req.audit = { newValues: updatedRow };

  res.status(200).json({ message: "Card updated successfully" });
});

exports.getCards = asynchandler(async (req, res) => {
  const cards = await cardService.getCards(req.scope);
  res.json(cards);
});

exports.getCardsByContactId = asynchandler(async (req, res) => {
  const contact_id = Number(req.params.contact_id);
  const cards = await cardService.getCardsByContactId(contact_id, req.scope);
  res.json({ data: cards });
});

exports.getCardById = asynchandler(async (req, res) => {
  const id = Number(req.params.id);
  const card = await cardService.getCardById(id, req.scope);
  res.json({ data: card });
});

exports.deleteCard = asynchandler(async (req, res) => {
  const id = Number(req.params.id);
  const userDelete = req.user?.user_id ?? req.user?.id ?? null;

  await cardService.deleteCard(id, userDelete, req.scope);

  res.json({ message: "Card deleted successfully" });
});
