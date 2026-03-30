const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { emitToUser } = require("../sockets");

const refreshConversationLastMessage = async (conversationId) => {
  const lastMessage = await Message.findOne({
    conversation: conversationId,
  }).sort({ createdAt: -1 });

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return;

  if (!lastMessage) {
    conversation.lastMessage = "";
  } else {
    conversation.lastMessage = lastMessage.text || "Đã gửi một hình ảnh";
  }

  await conversation.save();
};

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
    hiddenFor: [],
  });

  conversation.hiddenFor = [];
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
    hiddenFor: { $ne: currentUserId },
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

const updateMessageService = async ({ messageId, userId, text }) => {
  const message = await Message.findById(messageId);

  if (!message) {
    throw new Error("Không tìm thấy tin nhắn");
  }

  if (message.sender.toString() !== userId.toString()) {
    throw new Error("Bạn không có quyền sửa tin nhắn này");
  }

  if (!text?.trim()) {
    throw new Error("Nội dung tin nhắn không được để trống");
  }

  message.text = text.trim();
  message.isEdited = true;
  await message.save();

  const updatedMessage = await Message.findById(message._id).populate(
    "sender",
    "fullName username avatar"
  );

  const conversation = await Conversation.findById(message.conversation);
  if (conversation && conversation.lastMessage === "" ? false : true) {
    await refreshConversationLastMessage(message.conversation);
  }

  return updatedMessage;
};

const deleteMessageForMeService = async ({ messageId, userId }) => {
  const message = await Message.findById(messageId);

  if (!message) {
    throw new Error("Không tìm thấy tin nhắn");
  }

  const conversation = await Conversation.findById(message.conversation);

  if (!conversation) {
    throw new Error("Không tìm thấy cuộc trò chuyện");
  }

  const isMember = conversation.members.some(
    (memberId) => memberId.toString() === userId.toString()
  );

  if (!isMember) {
    throw new Error("Bạn không thuộc cuộc trò chuyện này");
  }

  if (!message.hiddenFor.some((id) => id.toString() === userId.toString())) {
    message.hiddenFor.push(userId);
    await message.save();
  }

  return {
    messageId: message._id.toString(),
    conversationId: message.conversation.toString(),
  };
};

const recallMessageService = async ({ messageId, userId }) => {
  const message = await Message.findById(messageId);

  if (!message) {
    throw new Error("Không tìm thấy tin nhắn");
  }

  if (message.sender.toString() !== userId.toString()) {
    throw new Error("Bạn chỉ có thể thu hồi tin nhắn của mình");
  }

  const conversationId = message.conversation.toString();

  await Message.findByIdAndDelete(messageId);
  await refreshConversationLastMessage(conversationId);

  return {
    messageId: messageId.toString(),
    conversationId,
  };
};

module.exports = {
  sendMessageService,
  getMessagesByConversationService,
  markConversationAsSeenService,
  updateMessageService,
  deleteMessageForMeService,
  recallMessageService,
};
