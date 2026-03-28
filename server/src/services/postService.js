const Post = require("../models/Post");
const Comment = require("../models/Comment");
const { createNotificationService } = require("./notificationService");

const createPostService = async ({ author, content, image }) => {
  const post = await Post.create({
    author,
    content,
    image: image || "",
  });

  return post;
};

const getAllPostsService = async () => {
  const posts = await Post.find()
    .populate("author", "fullName username avatar coverImage followers following")
    .sort({ createdAt: -1 });

  return posts;
};

const getPostsByUserService = async (userId) => {
  const posts = await Post.find({ author: userId })
    .populate("author", "fullName username avatar coverImage followers following")
    .sort({ createdAt: -1 });

  return posts;
};

const getPostByIdService = async (postId) => {
  const post = await Post.findById(postId).populate(
    "author",
    "fullName username avatar coverImage followers following"
  );

  if (!post) {
    throw new Error("Không tìm thấy bài viết");
  }

  return post;
};

const updatePostService = async ({ postId, userId, content, image }) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new Error("Không tìm thấy bài viết");
  }

  if (post.author.toString() !== userId.toString()) {
    throw new Error("Bạn không có quyền sửa bài viết này");
  }

  if (content !== undefined) {
    post.content = content;
  }

  if (image !== undefined) {
    post.image = image;
  }

  await post.save();

  const updatedPost = await Post.findById(postId).populate(
    "author",
    "fullName username avatar coverImage followers following"
  );

  return updatedPost;
};

const deletePostService = async ({ postId, userId }) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new Error("Không tìm thấy bài viết");
  }

  if (post.author.toString() !== userId.toString()) {
    throw new Error("Bạn không có quyền xóa bài viết này");
  }

  await Comment.deleteMany({ post: postId });
  await Post.findByIdAndDelete(postId);

  return true;
};

const toggleLikePostService = async ({ postId, userId }) => {
  const post = await Post.findById(postId).populate(
    "author",
    "fullName username avatar"
  );

  if (!post) {
    throw new Error("Không tìm thấy bài viết");
  }

  const alreadyLiked = post.likes.some(
    (id) => id.toString() === userId.toString()
  );

  if (alreadyLiked) {
    post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
  } else {
    post.likes.push(userId);

    await createNotificationService({
      recipient: post.author._id,
      sender: userId,
      type: "like",
      post: post._id,
      message: "đã thích bài viết của bạn",
    });
  }

  await post.save();

  return {
    liked: !alreadyLiked,
    likesCount: post.likes.length,
    post,
  };
};

const addCommentService = async ({ postId, userId, content }) => {
  const post = await Post.findById(postId).populate(
    "author",
    "fullName username avatar"
  );

  if (!post) {
    throw new Error("Không tìm thấy bài viết");
  }

  const comment = await Comment.create({
    post: postId,
    author: userId,
    content,
  });

  const populatedComment = await Comment.findById(comment._id).populate(
    "author",
    "fullName username avatar"
  );

  await createNotificationService({
    recipient: post.author._id,
    sender: userId,
    type: "comment",
    post: post._id,
    message: "đã bình luận bài viết của bạn",
  });

  return populatedComment;
};

const getCommentsByPostService = async (postId) => {
  const comments = await Comment.find({ post: postId })
    .populate("author", "fullName username avatar")
    .sort({ createdAt: -1 });

  return comments;
};

module.exports = {
  createPostService,
  getAllPostsService,
  getPostsByUserService,
  getPostByIdService,
  updatePostService,
  deletePostService,
  toggleLikePostService,
  addCommentService,
  getCommentsByPostService,
};