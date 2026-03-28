const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { emitToUser } = require("../sockets");

const sendMessageService = async ({
  conversationId,
  senderId,
  text,
  image,
}) => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw new Error("Không tìm thấy cuộc trò chuyện");
  }

  const isMember = conversation.members.some(
    (memberId) => memberId.toString() === senderId.toString()
  );

  if (!isMember) {
    throw new Error("Bạn không thuộc cuộc trò chuyện này");
  }

  if (!text && !image) {
    throw new Error("Tin nhắn không được để trống");
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    text: text || "",
    image: image || "",
    seenBy: [senderId],
  });

  conversation.lastMessage = text || "Đã gửi một hình ảnh";
  await conversation.save();

  const populatedMessage = await Message.findById(message._id).populate(
    "sender",
    "fullName username avatar"
  );

  return populatedMessage;
};

const getMessagesByConversationService = async (conversationId, currentUserId) => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw new Error("Không tìm thấy cuộc trò chuyện");
  }

  const isMember = conversation.members.some(
    (memberId) => memberId.toString() === currentUserId.toString()
  );

  if (!isMember) {
    throw new Error("Bạn không thuộc cuộc trò chuyện này");
  }

  const messages = await Message.find({
    conversation: conversationId,
  })
    .populate("sender", "fullName username avatar")
    .sort({ createdAt: 1 });

  return messages;
};

const markConversationAsSeenService = async (conversationId, currentUserId) => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw new Error("Không tìm thấy cuộc trò chuyện");
  }

  const isMember = conversation.members.some(
    (memberId) => memberId.toString() === currentUserId.toString()
  );

  if (!isMember) {
    throw new Error("Bạn không thuộc cuộc trò chuyện này");
  }

  await Message.updateMany(
    {
      conversation: conversationId,
      sender: { $ne: currentUserId },
      seenBy: { $ne: currentUserId },
    },
    {
      $addToSet: { seenBy: currentUserId },
    }
  );

  const otherUserId = conversation.members.find(
    (memberId) => memberId.toString() !== currentUserId.toString()
  );

  if (otherUserId) {
    emitToUser(otherUserId, "messagesSeen", {
      conversationId,
      seenBy: currentUserId.toString(),
    });
  }

  return true;
};

module.exports = {
  sendMessageService,
  getMessagesByConversationService,
  markConversationAsSeenService,
};