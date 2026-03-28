function ConversationList({
  conversations,
  currentUser,
  selectedConversationId,
  onSelectConversation,
  loading,
  onlineUsers = [],
}) {
  const getOtherMember = (conversation) => {
    return conversation.members?.find(
      (member) => member._id !== currentUser?._id,
    );
  };

  const isUserOnline = (userId) => onlineUsers.includes(userId);

  return (
    <div className="chat-sidebar">
      <div className="chat-sidebar-header">
        <h2>Tin nhắn</h2>
      </div>

      {loading ? (
        <div className="card">Đang tải cuộc trò chuyện...</div>
      ) : conversations.length === 0 ? (
        <div className="card">Chưa có cuộc trò chuyện nào</div>
      ) : (
        <div className="conversation-list">
          {conversations.map((conversation) => {
            const otherUser = getOtherMember(conversation);
            const isActive = selectedConversationId === conversation._id;
            const online = isUserOnline(otherUser?._id);

            return (
              <button
                key={conversation._id}
                className={`conversation-item ${isActive ? "active-conversation" : ""}`}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="conversation-avatar-wrap">
                  <img
                    src={otherUser?.avatar || "https://i.pravatar.cc/100"}
                    alt="avatar"
                    className="conversation-avatar"
                  />
                  {online && <span className="online-dot"></span>}
                </div>

                <div className="conversation-content">
                  <div className="conversation-name">
                    {otherUser?.fullName || "Người dùng"}
                  </div>
                  <div className="conversation-last-message">
                    {conversation.lastMessage || "Chưa có tin nhắn"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ConversationList;
