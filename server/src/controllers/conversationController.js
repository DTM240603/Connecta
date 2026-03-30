const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/response");
const {
  createOrGetConversationService,
  getMyConversationsService,
  hideConversationForMeService,
  deleteConversationPermanentlyService,
} = require("../services/conversationService");

const createOrGetConversation = asyncHandler(async (req, res) => {
  const { receiverId } = req.body;

  if (!receiverId) {
    res.status(400);
    throw new Error("receiverId là bắt buộc");
  }

  const conversation = await createOrGetConversationService(
    req.user._id,
    receiverId
  );

  return successResponse(
    res,
    "Lấy hoặc tạo cuộc trò chuyện thành công",
    conversation,
    201
  );
});

const getMyConversations = asyncHandler(async (req, res) => {
  const conversations = await getMyConversationsService(req.user._id);

  return successResponse(
    res,
    "Lấy danh sách cuộc trò chuyện thành công",
    conversations
  );
});

const hideConversationForMe = asyncHandler(async (req, res) => {
  const result = await hideConversationForMeService({
    conversationId: req.params.conversationId,
    currentUserId: req.user._id,
  });

  return successResponse(
    res,
    "Ẩn cuộc trò chuyện thành công",
    result
  );
});

const deleteConversationPermanently = asyncHandler(async (req, res) => {
  const result = await deleteConversationPermanentlyService({
    conversationId: req.params.conversationId,
    currentUserId: req.user._id,
  });

  return successResponse(
    res,
    "Xóa vĩnh viễn cuộc trò chuyện thành công",
    result
  );
});

module.exports = {
  createOrGetConversation,
  getMyConversations,
  hideConversationForMe,
  deleteConversationPermanently,
};
