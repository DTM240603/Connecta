const express = require("express");
const {
  createOrGetConversation,
  getMyConversations,
  hideConversationForMe,
  deleteConversationPermanently,
} = require("../controllers/conversationController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", protect, createOrGetConversation);
router.get("/", protect, getMyConversations);
router.patch("/:conversationId/hide", protect, hideConversationForMe);
router.delete("/:conversationId", protect, deleteConversationPermanently);

module.exports = router;
