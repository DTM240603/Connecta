const express = require("express");
const {
  sendMessage,
  getMessagesByConversation,
  markConversationAsSeen,
} = require("../controllers/messageController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", protect, sendMessage);
router.get("/:conversationId", protect, getMessagesByConversation);
router.patch("/:conversationId/seen", protect, markConversationAsSeen);

module.exports = router;