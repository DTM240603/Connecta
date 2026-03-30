const express = require("express");
const {
  sendMessage,
  getMessagesByConversation,
  markConversationAsSeen,
  updateMessage,
  deleteMessageForMe,
  recallMessage,
} = require("../controllers/messageController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", protect, sendMessage);
router.get("/:conversationId", protect, getMessagesByConversation);
router.patch("/:conversationId/seen", protect, markConversationAsSeen);

router.patch("/edit/:messageId", protect, updateMessage);
router.patch("/delete-for-me/:messageId", protect, deleteMessageForMe);
router.delete("/recall/:messageId", protect, recallMessage);

module.exports = router;