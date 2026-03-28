const User = require("../models/User");
const { createNotificationService } = require("./notificationService");

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select("-password");

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
    const existingUsername = await User.findOne({ username });

    if (existingUsername) {
      throw new Error("Username đã tồn tại");
    }

    user.username = username;
  }

  if (fullName !== undefined) user.fullName = fullName;
  if (bio !== undefined) user.bio = bio;
  if (avatar !== undefined) user.avatar = avatar;
  if (coverImage !== undefined) user.coverImage = coverImage;

  await user.save();

  return await User.findById(userId).select("-password");
};

const getAllUsers = async (currentUserId) => {
  const users = await User.find({
    _id: { $ne: currentUserId },
  }).select("-password");

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
      message: `${currentUser.fullName} đã theo dõi bạn`,
    });
  }

  await currentUser.save();
  await targetUser.save();

  return {
    following: !isFollowing,
    currentUserFollowingCount: currentUser.following.length,
    targetUserFollowersCount: targetUser.followers.length,
  };
};

const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-password");

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