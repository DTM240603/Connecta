import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  createOrGetConversationApi,
  getMessagesByConversationApi,
  markConversationAsSeenApi,
  sendMessageApi,
} from "../../services/chatService";
import { uploadImageApi } from "../../services/uploadService";
import { socket } from "../../services/socket";

function MiniChatBox({
  currentUser,
  targetUser,
  conversation: incomingConversation,
  onClose,
  onlineUsers = [],
}) {
  const [conversation, setConversation] = useState(incomingConversation || null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isTargetOnline = useMemo(() => {
    return targetUser?._id ? onlineUsers.includes(targetUser._id) : false;
  }, [targetUser, onlineUsers]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatDateLabel = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const formatTimeLabel = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const shouldShowFullDateTime = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;

    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();

    return currentDate !== previousDate;
  };

  const initChat = async () => {
    if (!targetUser?._id) return;

    try {
      setLoading(true);

      let currentConversation = incomingConversation;

      if (!currentConversation?._id) {
        const conversationRes = await createOrGetConversationApi(targetUser._id);
        currentConversation = conversationRes.data;
      }

      setConversation(currentConversation);

      const messagesRes = await getMessagesByConversationApi(currentConversation._id);
      setMessages(messagesRes.data || []);

      await markConversationAsSeenApi(currentConversation._id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initChat();
  }, [targetUser?._id, incomingConversation?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, previewImage]);

  useEffect(() => {
    const handleReceiveMessage = async (incomingMessage) => {
      if (!conversation?._id) return;
      if (incomingMessage?.conversation !== conversation._id) return;

      setMessages((prev) => [...prev, incomingMessage]);

      if (incomingMessage.sender?._id !== currentUser?._id) {
        await markConversationAsSeenApi(conversation._id);
      }
    };

    const handleTyping = (data) => {
      if (
        data?.conversationId === conversation?._id &&
        data?.senderId === targetUser?._id
      ) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (data) => {
      if (
        data?.conversationId === conversation?._id &&
        data?.senderId === targetUser?._id
      ) {
        setIsTyping(false);
      }
    };

    const handleMessagesSeen = (data) => {
      if (data?.conversationId !== conversation?._id) return;

      setMessages((prev) =>
        prev.map((msg) => {
          if (
            msg.sender?._id === currentUser?._id &&
            !msg.seenBy?.includes(data.seenBy)
          ) {
            return {
              ...msg,
              seenBy: [...(msg.seenBy || []), data.seenBy],
            };
          }
          return msg;
        })
      );
    };

    socket.on("getMessage", handleReceiveMessage);
    socket.on("getTyping", handleTyping);
    socket.on("getStopTyping", handleStopTyping);
    socket.on("messagesSeen", handleMessagesSeen);

    return () => {
      socket.off("getMessage", handleReceiveMessage);
      socket.off("getTyping", handleTyping);
      socket.off("getStopTyping", handleStopTyping);
      socket.off("messagesSeen", handleMessagesSeen);
    };
  }, [conversation?._id, targetUser?._id, currentUser?._id]);

  useEffect(() => {
    if (!conversation?._id || !targetUser?._id) return;

    if (messageText.trim()) {
      socket.emit("typing", {
        receiverId: targetUser._id,
        senderId: currentUser._id,
        conversationId: conversation._id,
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", {
          receiverId: targetUser._id,
          senderId: currentUser._id,
          conversationId: conversation._id,
        });
      }, 800);
    } else {
      socket.emit("stopTyping", {
        receiverId: targetUser._id,
        senderId: currentUser._id,
        conversationId: conversation._id,
      });
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageText, conversation?._id, targetUser?._id, currentUser?._id]);

  const handleChooseImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setPreviewImage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (!messageText.trim() && !selectedImage) return;
    if (!conversation?._id) return;

    try {
      setSending(true);

      let imageUrl = "";

      if (selectedImage) {
        const uploadRes = await uploadImageApi(selectedImage);
        imageUrl = uploadRes.data.url;
      }

      const res = await sendMessageApi({
        conversationId: conversation._id,
        text: messageText.trim(),
        image: imageUrl,
      });

      const newMessage = res.data;

      setMessages((prev) => [...prev, newMessage]);
      setMessageText("");
      clearSelectedImage();
      setIsTyping(false);

      socket.emit("stopTyping", {
        receiverId: targetUser._id,
        senderId: currentUser._id,
        conversationId: conversation._id,
      });

      socket.emit("sendMessage", {
        receiverId: targetUser._id,
        message: newMessage,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const latestSeenOwnMessageId = [...messages]
    .reverse()
    .find((msg) => {
      const seenByOther = msg.seenBy?.includes(targetUser?._id);
      return msg.sender?._id === currentUser?._id && seenByOther;
    })?._id;

  return (
    <div className="mini-chat-box">
      <div className="mini-chat-header">
        <div className="mini-chat-user">
          <img
            src={targetUser?.avatar || "https://i.pravatar.cc/100"}
            alt="avatar"
            className="mini-chat-avatar"
          />

          <div>
            <Link to={`/users/${targetUser?._id}`} className="mini-chat-name-link">
              <div className="mini-chat-name">{targetUser?.fullName}</div>
            </Link>

            <div className="mini-chat-status">
              {isTyping
                ? "Đang nhập..."
                : isTargetOnline
                  ? "Đang hoạt động"
                  : "Offline"}
            </div>
          </div>
        </div>

        <button className="mini-chat-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="mini-chat-body">
        {loading ? (
          <div className="mini-chat-empty">Đang tải tin nhắn...</div>
        ) : messages.length === 0 ? (
          <div className="mini-chat-empty">Chưa có tin nhắn nào</div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.sender?._id === currentUser?._id;
            const previousMessage = index > 0 ? messages[index - 1] : null;
            const showFullDateTime = shouldShowFullDateTime(message, previousMessage);
            const isSeenByOther = message.seenBy?.includes(targetUser?._id);

            return (
              <div
                key={message._id}
                className={`mini-message-row ${isOwn ? "own" : ""}`}
              >
                <div className={`mini-message-bubble ${isOwn ? "own" : ""}`}>
                  {message.text ? <div>{message.text}</div> : null}

                  {message.image ? (
                    <img
                      src={message.image}
                      alt="message"
                      className="mini-message-image"
                    />
                  ) : null}

                  <div className="mini-message-time">
                    {showFullDateTime
                      ? `${formatDateLabel(message.createdAt)} ${formatTimeLabel(
                        message.createdAt
                      )}`
                      : formatTimeLabel(message.createdAt)}
                  </div>

                  {isOwn &&
                    isSeenByOther &&
                    message._id === latestSeenOwnMessageId && (
                      <div className="mini-message-seen">Đã xem</div>
                    )}
                </div>
              </div>
            );
          })
        )}

        {isTyping && <div className="mini-typing-indicator">Đang nhập...</div>}

        <div ref={messagesEndRef} />
      </div>

      {previewImage ? (
        <div className="mini-chat-preview-wrap">
          <img
            src={previewImage}
            alt="preview"
            className="mini-chat-preview-image"
          />
          <button
            type="button"
            className="btn btn-outline"
            onClick={clearSelectedImage}
          >
            Xóa ảnh
          </button>
        </div>
      ) : null}

      <form className="mini-chat-form" onSubmit={handleSend}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: "none" }}
        />

        <button
          type="button"
          className="mini-chat-send mini-chat-image-btn"
          onClick={handleChooseImage}
          title="Chọn ảnh"
        >
          🖼
        </button>

        <input
          type="text"
          className="mini-chat-input"
          placeholder="Nhập tin nhắn..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
        />

        <button
          className="mini-chat-send mini-chat-send-icon"
          type="submit"
          disabled={sending}
        >
          {sending ? "..." : "➤"}
        </button>
      </form>
    </div>
  );
}

export default MiniChatBox;