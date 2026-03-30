import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ImagePlus,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  SendHorizontal,
  Trash2,
  X,
} from "lucide-react";
import ConfirmModal from "../common/ConfirmModal";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  createOrGetConversationApi,
  deleteMessageForMeApi,
  getMessagesByConversationApi,
  markConversationAsSeenApi,
  recallMessageApi,
  sendMessageApi,
  updateMessageApi,
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
  const [conversation, setConversation] = useState(
    incomingConversation || null,
  );
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");

  const [deleteForMeTarget, setDeleteForMeTarget] = useState(null);
  const [recallTarget, setRecallTarget] = useState(null);

  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [openActionMessageId, setOpenActionMessageId] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const actionRef = useRef(null);

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
        const conversationRes = await createOrGetConversationApi(
          targetUser._id,
        );
        currentConversation = conversationRes.data;
      }

      setConversation(currentConversation);

      const messagesRes = await getMessagesByConversationApi(
        currentConversation._id,
      );
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
    const handleClickOutside = (event) => {
      if (actionRef.current && !actionRef.current.contains(event.target)) {
        setOpenActionMessageId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleReceiveMessage = async (incomingMessage) => {
      if (!conversation?._id) return;
      if (incomingMessage?.conversation !== conversation._id) return;

      setMessages((prev) => {
        const existed = prev.some((msg) => msg._id === incomingMessage._id);
        if (existed) return prev;
        return [...prev, incomingMessage];
      });

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
        }),
      );
    };

    const handleMessageUpdated = (updatedMessage) => {
      if (updatedMessage?.conversation !== conversation?._id) return;

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg,
        ),
      );
    };

    const handleMessageRecalled = (payload) => {
      if (payload?.conversationId !== conversation?._id) return;

      setMessages((prev) =>
        prev.filter((msg) => msg._id !== payload.messageId),
      );
    };

    socket.on("getMessage", handleReceiveMessage);
    socket.on("getTyping", handleTyping);
    socket.on("getStopTyping", handleStopTyping);
    socket.on("messagesSeen", handleMessagesSeen);
    socket.on("messageUpdated", handleMessageUpdated);
    socket.on("messageRecalled", handleMessageRecalled);

    return () => {
      socket.off("getMessage", handleReceiveMessage);
      socket.off("getTyping", handleTyping);
      socket.off("getStopTyping", handleStopTyping);
      socket.off("messagesSeen", handleMessagesSeen);
      socket.off("messageUpdated", handleMessageUpdated);
      socket.off("messageRecalled", handleMessageRecalled);
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

  const handleSaveEdit = async (message) => {
    if (!editText.trim()) return;

    try {
      const res = await updateMessageApi(message._id, {
        text: editText.trim(),
      });

      const updatedMessage = res.data;

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg,
        ),
      );

      setEditingMessageId(null);
      setEditText("");
      setOpenActionMessageId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteForMe = async () => {
    if (!deleteForMeTarget) return;

    try {
      const res = await deleteMessageForMeApi(deleteForMeTarget._id);
      const deletedId = res.data.messageId;

      setMessages((prev) => prev.filter((msg) => msg._id !== deletedId));
      setDeleteForMeTarget(null);
      setOpenActionMessageId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRecall = async () => {
    if (!recallTarget) return;

    try {
      const res = await recallMessageApi(recallTarget._id);
      const recalledId = res.data.messageId;

      setMessages((prev) => prev.filter((msg) => msg._id !== recalledId));
      setRecallTarget(null);
      setOpenActionMessageId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const latestSeenOwnMessageId = [...messages].reverse().find((msg) => {
    const seenByOther = msg.seenBy?.includes(targetUser?._id);
    return msg.sender?._id === currentUser?._id && seenByOther;
  })?._id;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 flex h-[560px] w-[360px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-[0_24px_80px_rgba(249,115,22,0.18)]">
        <div className="flex items-center justify-between border-b border-line/80 bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              <Avatar className="h-10 w-10 border border-orange-100">
                <AvatarImage
                  src={targetUser?.avatar || "https://i.pravatar.cc/100"}
                  alt={targetUser?.fullName || "avatar"}
                />
                <AvatarFallback>
                  {(targetUser?.fullName || "U").slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              {isTargetOnline && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              )}
            </div>

            <div className="min-w-0">
              <Link
                to={`/users/${targetUser?._id}`}
                className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
              >
                {targetUser?.fullName}
              </Link>
              <div className="mt-1 text-xs text-muted">
                {isTyping
                  ? "Đang nhập..."
                  : isTargetOnline
                    ? "Đang hoạt động"
                    : "Offline"}
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-orange-50/30 px-3 py-4">
          {loading ? (
            <div className="rounded-3xl border border-dashed border-orange-200 bg-white px-4 py-8 text-center text-sm text-muted">
              Đang tải tin nhắn...
            </div>
          ) : messages.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-orange-200 bg-white px-4 py-8 text-center text-sm text-muted">
              Chưa có tin nhắn nào
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.sender?._id === currentUser?._id;
              const previousMessage = index > 0 ? messages[index - 1] : null;
              const showFullDateTime = shouldShowFullDateTime(
                message,
                previousMessage,
              );
              const isSeenByOther = message.seenBy?.includes(targetUser?._id);
              const isEditing = editingMessageId === message._id;
              const isMenuOpen = openActionMessageId === message._id;

              return (
                <div
                  key={message._id}
                  className={`mb-3 flex ${isOwn ? "justify-end" : "justify-start"}`}
                  onMouseEnter={() => setHoveredMessageId(message._id)}
                  onMouseLeave={() => {
                    if (!isMenuOpen) setHoveredMessageId(null);
                  }}
                >
                  <div
                    className="relative max-w-[90%]"
                  >
                    <div
                      className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 transition-opacity duration-150 ${
                        isOwn ? "left-0 -translate-x-[calc(100%+0.35rem)]" : "right-0 translate-x-[calc(100%+0.35rem)]"
                      } ${
                        hoveredMessageId === message._id || isMenuOpen
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    >
                      <div className="relative" ref={actionRef}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="pointer-events-auto h-8 w-8 rounded-full bg-white/95 text-muted shadow-sm ring-1 ring-orange-100"
                          onClick={() =>
                            setOpenActionMessageId((prev) =>
                              prev === message._id ? null : message._id,
                            )
                          }
                        >
                          <MoreHorizontal size={15} />
                        </Button>

                        {isMenuOpen && (
                          <div
                            className={`pointer-events-auto absolute top-9 z-20 min-w-36 rounded-2xl border border-orange-100 bg-white p-1 shadow-xl ${
                              isOwn ? "right-0" : "left-0"
                            }`}
                          >
                            {isOwn && (
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-orange-50"
                                onClick={() => {
                                  setEditingMessageId(message._id);
                                  setEditText(message.text || "");
                                  setOpenActionMessageId(null);
                                }}
                              >
                                <Pencil size={14} />
                                Sửa
                              </button>
                            )}

                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-orange-50"
                              onClick={() => setDeleteForMeTarget(message)}
                            >
                              <Trash2 size={14} />
                              Xóa
                            </button>

                            {isOwn && (
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50"
                                onClick={() => setRecallTarget(message)}
                              >
                                <RotateCcw size={14} />
                                Thu hồi
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={`min-w-0 rounded-3xl px-4 py-3 shadow-sm ${
                        isOwn
                          ? "bg-primary text-white"
                          : "border border-orange-100 bg-white text-foreground"
                      }`}
                    >
                      {isEditing ? (
                        <>
                          <Textarea
                            className="min-h-[88px] bg-white text-foreground"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                          />
                          <div className="mt-3 flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(message)}
                            >
                              Lưu
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingMessageId(null);
                                setEditText("");
                              }}
                            >
                              Hủy
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          {message.text ? (
                            <div className="break-words text-sm leading-6">
                              {message.text}
                            </div>
                          ) : null}

                          {message.image ? (
                            <img
                              src={message.image}
                              alt="message"
                              className="mt-2 max-h-56 w-full max-w-[220px] rounded-2xl object-cover"
                            />
                          ) : null}

                          <div
                            className={`mt-2 text-[11px] ${
                              isOwn ? "text-orange-100" : "text-muted"
                            }`}
                          >
                            {showFullDateTime
                              ? `${formatDateLabel(message.createdAt)} ${formatTimeLabel(
                                  message.createdAt,
                                )}`
                              : formatTimeLabel(message.createdAt)}
                            {message.isEdited ? " • Đã chỉnh sửa" : ""}
                          </div>

                          {isOwn &&
                            isSeenByOther &&
                            message._id === latestSeenOwnMessageId && (
                              <div className="mt-1 text-[11px] text-orange-100">
                                Đã xem
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {isTyping && (
            <div className="inline-flex rounded-full border border-orange-100 bg-white px-3 py-2 text-xs font-medium text-muted shadow-sm">
              Đang nhập...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {previewImage ? (
          <div className="border-t border-line/80 bg-white px-3 py-3">
            <div className="flex items-center gap-3 rounded-3xl border border-orange-100 bg-orange-50/60 p-3">
              <img
                src={previewImage}
                alt="preview"
                className="h-16 w-16 rounded-2xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">
                  Ảnh đã chọn
                </div>
                <div className="mt-1 text-xs text-muted">
                  Bạn có thể gửi hoặc xóa ảnh này.
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSelectedImage}
              >
                Xóa
              </Button>
            </div>
          </div>
        ) : null}

        <form
          className="border-t border-line/80 bg-white px-3 py-3"
          onSubmit={handleSend}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full"
              onClick={handleChooseImage}
              title="Chọn ảnh"
            >
              <ImagePlus size={17} />
            </Button>

            <Input
              type="text"
              className="h-10"
              placeholder="Nhập tin nhắn..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />

            <Button
              className="h-10 shrink-0 rounded-full px-3"
              type="submit"
              disabled={sending}
            >
              {sending ? "..." : <SendHorizontal size={16} />}
            </Button>
          </div>
        </form>
      </div>

      <ConfirmModal
        open={!!deleteForMeTarget}
        title="Xóa phía bạn?"
        description="Tin nhắn này sẽ bị xóa khỏi phía bạn, nhưng bên kia vẫn còn nhìn thấy."
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={handleDeleteForMe}
        onCancel={() => setDeleteForMeTarget(null)}
        loading={false}
      />

      <ConfirmModal
        open={!!recallTarget}
        title="Thu hồi tin nhắn?"
        description="Tin nhắn này sẽ bị thu hồi và cả hai bên đều không còn nhìn thấy nữa."
        confirmText="Thu hồi"
        cancelText="Hủy"
        onConfirm={handleRecall}
        onCancel={() => setRecallTarget(null)}
        loading={false}
      />
    </>
  );
}

export default MiniChatBox;
