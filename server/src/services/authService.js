const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const registerUser = async ({ fullName, username, email, password }) => {
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw new Error("Email đã tồn tại");
  }

  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    throw new Error("Username đã tồn tại");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    fullName,
    username,
    email,
    password: hashedPassword,
  });

  const token = generateToken(user._id);

  return {
    user: {
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
    },
    token,
  };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Email hoặc mật khẩu không đúng");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Email hoặc mật khẩu không đúng");
  }

  const token = generateToken(user._id);

  return {
    user: {
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
    },
    token,
  };
};

module.exports = {
  registerUser,
  loginUser,
};