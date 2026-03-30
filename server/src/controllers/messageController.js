const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/response");
const {
  sendMessageService,
  getMessagesByConversationService,
  markConversationAsSeenService,
  updateMessageService,
  deleteMessageForMeService,
  recallMessageService,
} = require("../services/messageService");
const { emitToUser } = require("../sockets");
const Conversation = require("../models/Conversation");

const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, text, image } = req.body;

  if (!conversationId) {
    res.status(400);
    throw new Error("conversationId là bắt buộc");
  }

  const message = await sendMessageService({
    conversationId,
    senderId: req.user._id,
    text,
    image,
  });

  return successResponse(res, "Gửi tin nhắn thành công", message, 201);
});

const getMessagesByConversation = asyncHandler(async (req, res) => {
  const messages = await getMessagesByConversationService(
    req.params.conversationId,
    req.user._id
  );

  return successResponse(
    res,
    "Lấy danh sách tin nhắn thành công",
    messages
  );
});

const markConversationAsSeen = asyncHandler(async (req, res) => {
  await markConversationAsSeenService(req.params.conversationId, req.user._id);

  return successResponse(res, "Đánh dấu đã xem thành công", null);
});

const updateMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text?.trim()) {
    res.status(400);
    throw new Error("Nội dung tin nhắn không được để trống");
  }

  const updatedMessage = await updateMessageService({
    messageId: req.params.messageId,
    userId: req.user._id,
    text: text.trim(),
  });

  const conversation = await Conversation.findById(updatedMessage.conversation);
  const otherUserId = conversation?.members.find(
    (memberId) => memberId.toString() !== req.user._id.toString()
  );

  if (otherUserId) {
    emitToUser(otherUserId, "messageUpdated", updatedMessage);
  }

  return successResponse(res, "Cập nhật tin nhắn thành công", updatedMessage);
});

const deleteMessageForMe = asyncHandler(async (req, res) => {
  const result = await deleteMessageForMeService({
    messageId: req.params.messageId,
    userId: req.user._id,
  });

  return successResponse(res, "Xóa tin nhắn phía bạn thành công", result);
});

const recallMessage = asyncHandler(async (req, res) => {
  const result = await recallMessageService({
    messageId: req.params.messageId,
    userId: req.user._id,
  });

  const conversation = await Conversation.findById(result.conversationId);
  const otherUserId = conversation?.members.find(
    (memberId) => memberId.toString() !== req.user._id.toString()
  );

  if (otherUserId) {
    emitToUser(otherUserId, "messageRecalled", result);
  }

  return successResponse(res, "Thu hồi tin nhắn thành công", result);
});

module.exports = {
  sendMessage,
  getMessagesByConversation,
  markConversationAsSeen,
  updateMessage,
  deleteMessageForMe,
  recallMessage,
};