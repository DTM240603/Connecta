const express = require("express");
const {
  getMe,
  updateMe,
  getUsers,
  toggleFollow,
  getUserProfile,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.get("/", protect, getUsers);
router.post("/:id/follow", protect, toggleFollow);
router.get("/:id", protect, getUserProfile);

module.exports = router;