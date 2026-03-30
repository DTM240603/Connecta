const User = require("../models/User");
const Post = require("../models/Post");

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const searchAllService = async (keyword) => {
  const normalizedKeyword = keyword?.trim();

  if (!normalizedKeyword) {
    return {
      users: [],
      posts: [],
    };
  }

  const regex = new RegExp(escapeRegex(normalizedKeyword), "i");

  const [users, posts] = await Promise.all([
    User.find({
      status: "active",
      $or: [{ fullName: regex }, { username: regex }],
    })
      .select("fullName username avatar")
      .sort({ createdAt: -1 })
      .limit(6),
    Post.find({
      content: regex,
    })
      .populate("author", "fullName username avatar")
      .select("content image author createdAt")
      .sort({ createdAt: -1 })
      .limit(6),
  ]);

  return {
    users,
    posts,
  };
};

module.exports = {
  searchAllService,
};
