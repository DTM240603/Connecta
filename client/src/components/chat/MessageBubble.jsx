function MessageBubble({
  message,
  isOwnMessage,
  isSeenByOther = false,
  showSeenText = false,
}) {
  return (
    <div className={`message-row ${isOwnMessage ? "own" : ""}`}>
      <div className={`message-bubble ${isOwnMessage ? "own-bubble" : ""}`}>
        {!isOwnMessage && (
          <div className="message-sender">
            {message.sender?.fullName || message.sender?.username || "User"}
          </div>
        )}

        {message.text ? <div>{message.text}</div> : null}

        {message.image ? (
          <img className="message-image" src={message.image} alt="message" />
        ) : null}

        <div className="message-time">
          {new Date(message.createdAt).toLocaleString("vi-VN")}
        </div>

        {isOwnMessage && isSeenByOther && showSeenText && (
          <div className="message-seen-text">Đã xem</div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;