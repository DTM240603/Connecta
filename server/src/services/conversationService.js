const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const createOrGetConversationService = async (currentUserId, receiverId) => {
  if (currentUserId.toString() === receiverId.toString()) {
    throw new Error("Không thể tạo cuộc trò chuyện với chính mình");
  }

  let conversation = await Conversation.findOne({
    members: { $all: [currentUserId, receiverId], $size: 2 },
  }).populate("members", "fullName username avatar");

  if (conversation) {
    return conversation;
  }

  conversation = await Conversation.create({
    members: [currentUserId, receiverId],
  });

  conversation = await Conversation.findById(conversation._id).populate(
    "members",
    "fullName username avatar"
  );

  return conversation;
};

const getMyConversationsService = async (currentUserId) => {
  const conversations = await Conversation.find({
    members: currentUserId,
  })
    .populate("members", "fullName username avatar")
    .sort({ updatedAt: -1 });

  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conversation) => {
      const unreadCount = await Message.countDocuments({
        conversation: conversation._id,
        sender: { $ne: currentUserId },
        seenBy: { $ne: currentUserId },
      });

      return {
        ...conversation.toObject(),
        unreadCount,
      };
    })
  );

  return conversationsWithUnread;
};

module.exports = {
  createOrGetConversationService,
  getMyConversationsService,
};