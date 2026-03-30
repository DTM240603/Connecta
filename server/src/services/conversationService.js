const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const buildPairKey = (firstUserId, secondUserId) =>
  [firstUserId.toString(), secondUserId.toString()].sort().join(":");

const createOrGetConversationService = async (currentUserId, receiverId) => {
  if (currentUserId.toString() === receiverId.toString()) {
    throw new Error("Không thể tạo cuộc trò chuyện với chính mình");
  }

  const pairKey = buildPairKey(currentUserId, receiverId);

  let conversation = await Conversation.findOne({
    $or: [
      { pairKey },
      { members: { $all: [currentUserId, receiverId], $size: 2 } },
    ],
  })
    .sort({ updatedAt: -1 })
    .populate("members", "fullName username avatar");

  if (conversation) {
    let shouldSave = false;

    if (!conversation.pairKey) {
      conversation.pairKey = pairKey;
      shouldSave = true;
    }

    if (
      conversation.hiddenFor?.some(
        (id) => id.toString() === currentUserId.toString(),
      )
    ) {
      conversation.hiddenFor = conversation.hiddenFor.filter(
        (id) => id.toString() !== currentUserId.toString(),
      );
      shouldSave = true;
    }

    if (shouldSave) {
      await conversation.save();
    }
    return conversation;
  }

  conversation = await Conversation.create({
    members: [currentUserId, receiverId],
    pairKey,
    hiddenFor: [],
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
    hiddenFor: { $ne: currentUserId },
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

  const dedupedConversations = [];
  const seenConversationIds = new Set();
  const seenTargetUsers = new Map();

  for (const conversation of conversationsWithUnread) {
    const conversationId = conversation._id.toString();
    const otherUser = conversation.members?.find(
      (member) => member._id.toString() !== currentUserId.toString(),
    );
    const targetUserId = otherUser?._id?.toString();

    if (seenConversationIds.has(conversationId)) {
      continue;
    }

    seenConversationIds.add(conversationId);

    if (!targetUserId) {
      dedupedConversations.push(conversation);
      continue;
    }

    const existingIndex = seenTargetUsers.get(targetUserId);

    if (existingIndex === undefined) {
      seenTargetUsers.set(targetUserId, dedupedConversations.length);
      dedupedConversations.push(conversation);
      continue;
    }

    dedupedConversations[existingIndex] = {
      ...dedupedConversations[existingIndex],
      unreadCount:
        (dedupedConversations[existingIndex].unreadCount || 0) +
        (conversation.unreadCount || 0),
    };
  }

  return dedupedConversations;
};

const hideConversationForMeService = async ({
  conversationId,
  currentUserId,
}) => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw new Error("Không tìm thấy cuộc trò chuyện");
  }

  const isMember = conversation.members.some(
    (memberId) => memberId.toString() === currentUserId.toString(),
  );

  if (!isMember) {
    throw new Error("Bạn không thuộc cuộc trò chuyện này");
  }

  if (
    !conversation.hiddenFor.some(
      (hiddenUserId) => hiddenUserId.toString() === currentUserId.toString(),
    )
  ) {
    conversation.hiddenFor.push(currentUserId);
    await conversation.save();
  }

  return {
    conversationId: conversation._id.toString(),
  };
};

const deleteConversationPermanentlyService = async ({
  conversationId,
  currentUserId,
}) => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw new Error("Không tìm thấy cuộc trò chuyện");
  }

  const isMember = conversation.members.some(
    (memberId) => memberId.toString() === currentUserId.toString(),
  );

  if (!isMember) {
    throw new Error("Bạn không thuộc cuộc trò chuyện này");
  }

  await Message.deleteMany({ conversation: conversation._id });
  await Conversation.findByIdAndDelete(conversation._id);

  return {
    conversationId: conversation._id.toString(),
  };
};

module.exports = {
  createOrGetConversationService,
  getMyConversationsService,
  hideConversationForMeService,
  deleteConversationPermanentlyService,
};
