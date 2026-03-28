const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/response");
const {
  sendMessageService,
  getMessagesByConversationService,
  markConversationAsSeenService,
} = require("../services/messageService");

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

module.exports = {
  sendMessage,
  getMessagesByConversation,
  markConversationAsSeen,
};