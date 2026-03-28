import { useEffect, useMemo, useRef, useState } from "react";
import {
  getMessagesByConversationApi,
  markConversationAsSeenApi,
  sendMessageApi,
} from "../../services/chatService";
import { uploadImageApi } from "../../services/uploadService";
import { socket } from "../../services/socket";
import MessageBubble from "./MessageBubble";

function ChatBox({
  conversation,
  currentUser,
  onRefreshConversations,
  onlineUsers = [],
}) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);

  const otherUser = useMemo(() => {
    return conversation?.members?.find((member) => member._id !== currentUser?._id);
  }, [conversation, currentUser]);

  const isOtherUserOnline = otherUser?._id
    ? onlineUsers.includes(otherUser._id)
    : false;

  const fetchMessages = async () => {
    if (!conversation?._id) return;

    try {
      setLoadingMessages(true);
      const res = await getMessagesByConversationApi(conversation._id);
      setMessages(res.data || []);
      await markConversationAsSeenApi(conversation._id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [conversation?._id]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const handleReceiveMessage = async (incomingMessage) => {
      if (incomingMessage?.conversation !== conversation?._id) return;

      setMessages((prev) => [...prev, incomingMessage]);

      if (incomingMessage.sender?._id !== currentUser?._id) {
        await markConversationAsSeenApi(conversation._id);
      }
    };

    const handleTyping = (data) => {
      if (
        data?.conversationId === conversation?._id &&
        data?.senderId === otherUser?._id
      ) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (data) => {
      if (
        data?.conversationId === conversation?._id &&
        data?.senderId === otherUser?._id
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
  }, [conversation?._id, otherUser?._id, currentUser?._id]);

  useEffect(() => {
    if (!conversation?._id || !otherUser?._id) return;

    if (messageText.trim()) {
      socket.emit("typing", {
        receiverId: otherUser._id,
        senderId: currentUser._id,
        conversationId: conversation._id,
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", {
          receiverId: otherUser._id,
          senderId: currentUser._id,
          conversationId: conversation._id,
        });
      }, 800);
    } else {
      socket.emit("stopTyping", {
        receiverId: otherUser._id,
        senderId: currentUser._id,
        conversationId: conversation._id,
      });
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageText, conversation?._id, otherUser?._id, currentUser?._id]);

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

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim() && !selectedImage) return;

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
        receiverId: otherUser._id,
        senderId: currentUser._id,
        conversationId: conversation._id,
      });

      if (otherUser?._id) {
        socket.emit("sendMessage", {
          receiverId: otherUser._id,
          message: newMessage,
        });
      }

      await onRefreshConversations();
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const latestSeenOwnMessageId = [...messages]
    .reverse()
    .find((msg) => {
      const seenByOther = msg.seenBy?.includes(otherUser?._id);
      return msg.sender?._id === currentUser?._id && seenByOther;
    })?._id;

  if (!conversation) {
    return (
      <div className="chat-box-empty">
        <div className="card">Chọn một cuộc trò chuyện để bắt đầu nhắn tin</div>
      </div>
    );
  }

  return (
    <div className="chat-box">
      <div className="chat-box-header">
        <div className="conversation-avatar-wrap">
          <img
            src={otherUser?.avatar || "https://i.pravatar.cc/100"}
            alt="avatar"
            className="conversation-avatar"
          />
          {isOtherUserOnline && <span className="online-dot"></span>}
        </div>

        <div>
          <h3>{otherUser?.fullName || "Người dùng"}</h3>
          <p className="muted">
            @{otherUser?.username || "unknown"}{" "}
            {isOtherUserOnline ? "• Đang hoạt động" : "• Offline"}
          </p>
        </div>
      </div>

      <div className="chat-messages">
        {loadingMessages ? (
          <div className="card">Đang tải tin nhắn...</div>
        ) : messages.length === 0 ? (
          <div className="card">Chưa có tin nhắn nào</div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender?._id === currentUser?._id;
            const isSeenByOther = message.seenBy?.includes(otherUser?._id);

            return (
              <MessageBubble
                key={message._id}
                message={message}
                isOwnMessage={isOwn}
                isSeenByOther={isSeenByOther}
                showSeenText={message._id === latestSeenOwnMessageId}
              />
            );
          })
        )}

        {isTyping && <div className="typing-indicator">Đang nhập...</div>}

        <div ref={messageEndRef} />
      </div>

      {previewImage && (
        <div className="chat-image-preview-wrap">
          <img src={previewImage} alt="preview" className="chat-image-preview" />
          <button
            type="button"
            className="btn btn-outline"
            onClick={clearSelectedImage}
          >
            Xóa ảnh
          </button>
        </div>
      )}

      <form className="chat-form" onSubmit={handleSendMessage}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: "none" }}
        />

        <button
          type="button"
          className="btn btn-outline"
          onClick={handleChooseImage}
        >
          Ảnh
        </button>

        <input
          className="input"
          type="text"
          placeholder="Nhập tin nhắn..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
        />

        <button className="btn btn-primary" type="submit" disabled={sending}>
          {sending ? "Đang gửi..." : "Gửi"}
        </button>
      </form>
    </div>
  );
}

export default ChatBox;