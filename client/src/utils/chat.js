export const dedupeConversationsForUser = (
  conversations = [],
  currentUserId,
) => {
  const uniqueById = new Set();
  const uniqueByTargetUser = new Set();
  const deduped = [];

  for (const conversation of conversations) {
    if (!conversation?._id) continue;

    const conversationId = conversation._id.toString();
    if (uniqueById.has(conversationId)) continue;
    uniqueById.add(conversationId);

    if (!currentUserId) {
      deduped.push(conversation);
      continue;
    }

    const otherUser = conversation.members?.find(
      (member) => member?._id?.toString() !== currentUserId.toString(),
    );
    const targetUserId = otherUser?._id?.toString();

    if (targetUserId && uniqueByTargetUser.has(targetUserId)) {
      continue;
    }

    if (targetUserId) {
      uniqueByTargetUser.add(targetUserId);
    }

    deduped.push(conversation);
  }

  return deduped;
};
