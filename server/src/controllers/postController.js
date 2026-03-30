const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/response");
const {
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
} = require("../services/postService");

const createPost = asyncHandler(async (req, res) => {
  const { content, image } = req.body;

  if (!content && !image) {
    res.status(400);
    throw new Error("Bài viết phải có nội dung hoặc ảnh");
  }

  const post = await createPostService({
    author: req.user._id,
    content: content || "",
    image,
  });

  return successResponse(res, "Tạo bài viết thành công", post, 201);
});

const getAllPosts = asyncHandler(async (req, res) => {
  const posts = await getAllPostsService();
  return successResponse(res, "Lấy danh sách bài viết thành công", posts);
});

const getPostsByUserController = asyncHandler(async (req, res) => {
  const posts = await getPostsByUserService(req.params.userId);
  return successResponse(res, "Lấy danh sách bài viết của user thành công", posts);
});

const getPostById = asyncHandler(async (req, res) => {
  const post = await getPostByIdService(req.params.id);
  return successResponse(res, "Lấy chi tiết bài viết thành công", post);
});

const updatePost = asyncHandler(async (req, res) => {
  const { content, image } = req.body;

  if (content === undefined && image === undefined) {
    res.status(400);
    throw new Error("Không có dữ liệu để cập nhật");
  }

  const updatedPost = await updatePostService({
    postId: req.params.id,
    userId: req.user._id,
    content,
    image,
  });

  return successResponse(res, "Cập nhật bài viết thành công", updatedPost);
});

const deletePost = asyncHandler(async (req, res) => {
  await deletePostService({
    postId: req.params.id,
    userId: req.user._id,
  });

  return successResponse(res, "Xóa bài viết thành công", null);
});

const toggleLikePost = asyncHandler(async (req, res) => {
  const result = await toggleLikePostService({
    postId: req.params.id,
    userId: req.user._id,
  });

  return successResponse(
    res,
    result.liked ? "Đã thích bài viết" : "Đã bỏ thích bài viết",
    result
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { content, parentCommentId, replyToUserId } = req.body;

  if (!content?.trim()) {
    res.status(400);
    throw new Error("Nội dung bình luận không được để trống");
  }

  const comment = await addCommentService({
    postId: req.params.id,
    userId: req.user._id,
    content: content.trim(),
    parentCommentId,
    replyToUserId,
  });

  return successResponse(res, "Bình luận thành công", comment, 201);
});

const getCommentsByPost = asyncHandler(async (req, res) => {
  const comments = await getCommentsByPostService(req.params.id);
  return successResponse(res, "Lấy danh sách bình luận thành công", comments);
});

const updateComment = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content?.trim()) {
    res.status(400);
    throw new Error("Nội dung bình luận không được để trống");
  }

  const updatedComment = await updateCommentService({
    commentId: req.params.commentId,
    userId: req.user._id,
    content: content.trim(),
  });

  return successResponse(res, "Cập nhật bình luận thành công", updatedComment);
});

const deleteComment = asyncHandler(async (req, res) => {
  await deleteCommentService({
    commentId: req.params.commentId,
    userId: req.user._id,
  });

  return successResponse(res, "Xóa bình luận thành công", null);
});

module.exports = {
  createPost,
  getAllPosts,
  getPostsByUserController,
  getPostById,
  updatePost,
  deletePost,
  toggleLikePost,
  addComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
};