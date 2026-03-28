function ChatDropdown({
    open,
    conversations = [],
    currentUserId,
    onSelectConversation,
}) {
    if (!open) return null;

    return (
        <div className="message-dropdown">
            <div className="message-dropdown-header">
                <h3>Tin nhắn</h3>
            </div>

            <div className="message-dropdown-body">
                {conversations.length === 0 ? (
                    <div className="message-dropdown-empty">Chưa có cuộc trò chuyện nào</div>
                ) : (
                    conversations.map((conversation) => {
                        const otherUser = conversation.members?.find(
                            (member) => member._id !== currentUserId
                        );

                        return (
                            <button
                                key={conversation._id}
                                className="message-dropdown-item"
                                onClick={() => onSelectConversation(conversation)}
                            >
                                <img
                                    src={otherUser?.avatar || "https://i.pravatar.cc/100"}
                                    alt="avatar"
                                    className="message-dropdown-avatar"
                                />

                                <div className="message-dropdown-content">
                                    <div className="message-dropdown-name">
                                        {otherUser?.fullName || "Người dùng"}
                                    </div>

                                    <div className="message-dropdown-last">
                                        {conversation.lastMessage || "Bắt đầu cuộc trò chuyện"}
                                    </div>
                                </div>

                                {conversation.unreadCount > 0 && (
                                    <span className="message-dropdown-unread-dot"></span>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default ChatDropdown;