const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/response");
const { registerUser, loginUser } = require("../services/authService");

const register = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;

  if (!fullName || !username || !email || !password) {
    res.status(400);
    throw new Error("Vui lòng nhập đầy đủ thông tin");
  }

  const data = await registerUser({ fullName, username, email, password });

  return successResponse(res, "Đăng ký thành công", data, 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Vui lòng nhập email và mật khẩu");
  }

  const data = await loginUser({ email, password });

  return successResponse(res, "Đăng nhập thành công", data);
});

module.exports = {
  register,
  login,
};