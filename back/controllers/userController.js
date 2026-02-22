const asynchandler = require("express-async-handler");
const userService = require("../services/userService");

exports.createUser = asynchandler(async (req, res) => {
    const { username, email, password, fullName } = req.body;
    const userAdd=req.user?.user_id??req.user?.id;
    const userId = await userService.createUser(username, email, password, fullName,userAdd);
    res.locals.newUserId = userId; 
    req.audit={ newValues: { user_id: userId, username, email, fullName } };
    res.status(201).json({ message: 'User created successfully', userId });
});
exports.updateUser = asynchandler(async (req, res) => {
    const { userId } = req.params;
    const { username, email, password, fullName } = req.body;
    const userUpdate=req.user.id;
    const updatedUserId = await userService.updateUser(userId, username, email, password, fullName, userUpdate);
    res.status(200).json({ message: 'User updated successfully', userId: updatedUserId });
});
exports.deleteUser = asynchandler(async (req, res) => {
    const { userId } = req.params;
    const userDelete=req.user.id;
    await userService.deleteUser(userId,userDelete);
    res.status(200).json({ message: 'User deleted successfully',    data:  userId  });
});
exports.getUserById = asynchandler(async (req, res) => {
    const { userId } = req.params;
    const user = await userService.getUserById(userId);
    res.status(200).json({ data: user });
});
exports.getUserByUsername = asynchandler(async (req, res) => {
    const { username } = req.params;
    const user = await userService.getUserByUsername(username);
    res.status(200).json({ data: user });
});
exports.getAllUsers = asynchandler(async (req, res) => {
    const users = await userService.getAllUsers();
    res.status(200).json({ data: users });
});
exports.disableUser = asynchandler(async (req, res) => {
  const { userId } = req.params;
  await userService.disableUser(userId, req.user.user_id);
  res.json({ message: 'User disabled successfully' });
});

// ─── User Scope ───────────────────────────────────────────────────────────────

exports.getUserScope = asynchandler(async (req, res) => {
  const { userId } = req.params;
  const scope = await userService.getUserScope(userId);
  res.status(200).json({ data: scope });
});

exports.updateUserScope = asynchandler(async (req, res) => {
  const { userId } = req.params;
  const { hotelIds, departmentIds, hotelDeptPairs } = req.body;
  await userService.updateUserScope(userId, hotelIds || [], departmentIds || [], hotelDeptPairs || []);
  const updatedScope = await userService.getUserScope(userId);
  req.audit = { newValues: { hotelIds: updatedScope.hotelIds, departmentIds: updatedScope.departmentIds } };
  res.status(200).json({ data: updatedScope, message: 'تم تحديث نطاق المستخدم بنجاح' });
});
