const express = require("express");
const {
  createOrGetConversation,
  getMyConversations,
} = require("../controllers/conversationController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", protect, createOrGetConversation);
router.get("/", protect, getMyConversations);

module.exports = router;