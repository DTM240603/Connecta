const express = require("express");
const {
  createPost,
  getAllPosts,
  getPostsByUserController,
  getPostById,
  updatePost,
  deletePost,
  toggleLikePost,
  addComment,
  getCommentsByPost,
} = require("../controllers/postController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", getAllPosts);
router.get("/user/:userId", protect, getPostsByUserController);
router.get("/:id", protect, getPostById);

router.post("/", protect, createPost);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);

router.post("/:id/like", protect, toggleLikePost);
router.post("/:id/comments", protect, addComment);
router.get("/:id/comments", getCommentsByPost);

module.exports = router;