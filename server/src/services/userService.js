const User = require("../models/User");
const { createNotificationService } = require("./notificationService");

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId)
    .select("-password")
    .populate("followers", "fullName username avatar")
    .populate("following", "fullName username avatar");

  if (!user) {
    throw new Error("Không tìm thấy người dùng");
  }

  return user;
};

const updateCurrentUser = async (userId, payload) => {
  const { fullName, username, bio, avatar, coverImage } = payload;

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("Không tìm thấy người dùng");
  }

  if (username && username !== user.username) {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new Error("Username đã tồn tại");
    }
  }

  user.fullName = fullName ?? user.fullName;
  user.username = username ?? user.username;
  user.bio = bio ?? user.bio;
  user.avatar = avatar ?? user.avatar;
  user.coverImage = coverImage ?? user.coverImage;

  await user.save();

  const updatedUser = await User.findById(user._id)
    .select("-password")
    .populate("followers", "fullName username avatar")
    .populate("following", "fullName username avatar");

  return updatedUser;
};

const getAllUsers = async (currentUserId) => {
  const users = await User.find({
    _id: { $ne: currentUserId },
    status: "active",
  })
    .select("-password")
    .populate("followers", "fullName username avatar")
    .populate("following", "fullName username avatar")
    .sort({ createdAt: -1 });

  return users;
};

const toggleFollowUser = async (currentUserId, targetUserId) => {
  if (currentUserId.toString() === targetUserId.toString()) {
    throw new Error("Bạn không thể tự theo dõi chính mình");
  }

  const currentUser = await User.findById(currentUserId);
  const targetUser = await User.findById(targetUserId);

  if (!currentUser || !targetUser) {
    throw new Error("Không tìm thấy người dùng");
  }

  const isFollowing = currentUser.following.some(
    (id) => id.toString() === targetUserId.toString()
  );

  if (isFollowing) {
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetUserId.toString()
    );

    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== currentUserId.toString()
    );
  } else {
    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);

    await createNotificationService({
      recipient: targetUserId,
      sender: currentUserId,
      type: "follow",
      message: "đã theo dõi bạn",
    });
  }

  await currentUser.save();
  await targetUser.save();

  const refreshedCurrentUser = await User.findById(currentUserId)
    .select("-password")
    .populate("followers", "fullName username avatar")
    .populate("following", "fullName username avatar");

  return {
    following: !isFollowing,
    user: refreshedCurrentUser,
  };
};

const getUserById = async (userId) => {
  const user = await User.findById(userId)
    .select("-password")
    .populate("followers", "fullName username avatar")
    .populate("following", "fullName username avatar");

  if (!user) {
    throw new Error("Không tìm thấy người dùng");
  }

  return user;
};

module.exports = {
  getCurrentUser,
  updateCurrentUser,
  getAllUsers,
  toggleFollowUser,
  getUserById,
};