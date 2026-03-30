const Post = require("../models/Post");
const Comment = require("../models/Comment");
const { createNotificationService } = require("./notificationService");
const { emitToAll } = require("../sockets");

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

const addCommentService = async ({
  postId,
  userId,
  content,
  parentCommentId = null,
  replyToUserId = null,
}) => {
  const post = await Post.findById(postId).populate(
    "author",
    "fullName username avatar"
  );

  if (!post) {
    throw new Error("Không tìm thấy bài viết");
  }

  let normalizedParentCommentId = null;

  if (parentCommentId) {
    const parentComment = await Comment.findById(parentCommentId);
    if (!parentComment) {
      throw new Error("Không tìm thấy bình luận cha");
    }

    normalizedParentCommentId = parentComment.parentComment || parentComment._id;
  }

  const comment = await Comment.create({
    post: postId,
    author: userId,
    content,
    parentComment: normalizedParentCommentId,
    replyToUser: replyToUserId || null,
  });

  const populatedComment = await Comment.findById(comment._id)
    .populate("author", "fullName username avatar")
    .populate("replyToUser", "fullName username avatar");

  await createNotificationService({
    recipient: post.author._id,
    sender: userId,
    type: "comment",
    post: post._id,
    comment: populatedComment._id,
    message: "đã bình luận bài viết của bạn",
  });

  if (
    replyToUserId &&
    replyToUserId.toString() !== post.author._id.toString() &&
    replyToUserId.toString() !== userId.toString()
  ) {
    await createNotificationService({
      recipient: replyToUserId,
      sender: userId,
      type: "comment",
      post: post._id,
      comment: populatedComment._id,
      message: "đã trả lời bình luận của bạn",
    });
  }

  emitToAll("postCommentChanged", {
    action: "created",
    postId,
    comment: populatedComment,
  });

  return populatedComment;
};

const getCommentsByPostService = async (postId) => {
  const comments = await Comment.find({ post: postId })
    .populate("author", "fullName username avatar")
    .populate("replyToUser", "fullName username avatar")
    .sort({ createdAt: 1 });

  return comments;
};

const updateCommentService = async ({ commentId, userId, content }) => {
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new Error("Không tìm thấy bình luận");
  }

  if (comment.author.toString() !== userId.toString()) {
    throw new Error("Bạn không có quyền sửa bình luận này");
  }

  comment.content = content;
  await comment.save();

  const updatedComment = await Comment.findById(commentId)
    .populate("author", "fullName username avatar")
    .populate("replyToUser", "fullName username avatar");

  emitToAll("postCommentChanged", {
    action: "updated",
    postId: updatedComment.post.toString(),
    comment: updatedComment,
  });

  return updatedComment;
};

const deleteCommentService = async ({ commentId, userId }) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new Error("Không tìm thấy bình luận");
  }

  const post = await Post.findById(comment.post);
  if (!post) {
    throw new Error("Không tìm thấy bài viết");
  }

  const isCommentAuthor = comment.author.toString() === userId.toString();
  const isPostOwner = post.author.toString() === userId.toString();

  if (!isCommentAuthor && !isPostOwner) {
    throw new Error("Bạn không có quyền xóa bình luận này");
  }

  const replyIds = await Comment.find({ parentComment: commentId }).select("_id");
  const deletedIds = [commentId, ...replyIds.map((item) => item._id.toString())];

  await Comment.deleteMany({
    $or: [{ _id: commentId }, { parentComment: commentId }],
  });

  emitToAll("postCommentChanged", {
    action: "deleted",
    postId: post._id.toString(),
    deletedIds,
  });

  return true;
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
  updateCommentService,
  deleteCommentService,
};