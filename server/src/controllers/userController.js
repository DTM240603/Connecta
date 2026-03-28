const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/response");
const {
  getCurrentUser,
  updateCurrentUser,
  getAllUsers,
  toggleFollowUser,
  getUserById,
} = require("../services/userService");

const getMe = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user._id);

  return successResponse(res, "Lấy thông tin người dùng thành công", user);
});

const updateMe = asyncHandler(async (req, res) => {
  const { fullName, username, bio, avatar, coverImage } = req.body;

  const updatedUser = await updateCurrentUser(req.user._id, {
    fullName,
    username,
    bio,
    avatar,
    coverImage,
  });

  return successResponse(res, "Cập nhật thông tin thành công", updatedUser);
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await getAllUsers(req.user._id);

  return successResponse(res, "Lấy danh sách người dùng thành công", users);
});

const toggleFollow = asyncHandler(async (req, res) => {
  const result = await toggleFollowUser(req.user._id, req.params.id);

  return successResponse(
    res,
    result.following ? "Theo dõi thành công" : "Bỏ theo dõi thành công",
    result
  );
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);

  return successResponse(res, "Lấy profile thành công", user);
});

module.exports = {
  getMe,
  updateMe,
  getUsers,
  toggleFollow,
  getUserProfile,
};