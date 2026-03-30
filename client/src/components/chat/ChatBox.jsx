import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, SendHorizontal } from "lucide-react";
import ConfirmModal from "../common/ConfirmModal";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  deleteMessageForMeApi,
  getMessagesByConversationApi,
  markConversationAsSeenApi,
  recallMessageApi,
  sendMessageApi,
  updateMessageApi,
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

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");

  const [deleteForMeTarget, setDeleteForMeTarget] = useState(null);
  const [recallTarget, setRecallTarget] = useState(null);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);

  const otherUser = useMemo(() => {
    return conversation?.members?.find(
      (member) => member._id !== currentUser?._id,
    );
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
  }, [messages, isTyping, previewImage]);

  useEffect(() => {
    const handleReceiveMessage = async (incomingMessage) => {
      if (incomingMessage?.conversation !== conversation?._id) return;

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

      await onRefreshConversations?.();
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleStartEdit = (message) => {
    setEditingMessageId(message._id);
    setEditText(message.text || "");
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
      await onRefreshConversations?.();
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
      await onRefreshConversations?.();
    } catch (error) {
      console.error(error);
    }
  };

  const latestSeenOwnMessageId = [...messages].reverse().find((msg) => {
    const seenByOther = msg.seenBy?.includes(otherUser?._id);
    return msg.sender?._id === currentUser?._id && seenByOther;
  })?._id;

  if (!conversation) {
    return (
      <Card className="flex min-h-[520px] items-center justify-center">
        <CardContent className="p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-primary">
            <SendHorizontal size={24} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            Chọn một cuộc trò chuyện
          </h3>
          <p className="mt-2 text-sm text-muted">
            Bắt đầu nhắn tin với bạn bè từ danh sách bên trái.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="flex min-h-[520px] flex-col overflow-hidden">
        <CardHeader className="border-b border-line/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12 border border-orange-100">
                <AvatarImage
                  src={otherUser?.avatar || "https://i.pravatar.cc/100"}
                  alt={otherUser?.fullName || "avatar"}
                />
                <AvatarFallback>
                  {(otherUser?.fullName || "U").slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              {isOtherUserOnline && (
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
              )}
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-foreground">
                {otherUser?.fullName || "Người dùng"}
              </h3>
              <p className="mt-1 text-sm text-muted">
                @{otherUser?.username || "unknown"}{" "}
                {isOtherUserOnline ? "• Đang hoạt động" : "• Offline"}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <div className="flex-1 space-y-4 overflow-y-auto bg-orange-50/30 px-4 py-5">
            {loadingMessages ? (
              <div className="rounded-3xl border border-dashed border-orange-200 bg-white px-4 py-8 text-center text-sm text-muted">
                Đang tải tin nhắn...
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-orange-200 bg-white px-4 py-8 text-center text-sm text-muted">
                Chưa có tin nhắn nào
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.sender?._id === currentUser?._id;
                const isSeenByOther = message.seenBy?.includes(otherUser?._id);
                const isEditing = editingMessageId === message._id;

                return (
                  <div key={message._id}>
                    {isEditing ? (
                      <div
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div className="w-full max-w-[78%] rounded-3xl border border-orange-100 bg-white p-4 shadow-sm">
                          <Textarea
                            className="min-h-[96px]"
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
                        </div>
                      </div>
                    ) : (
                      <MessageBubble
                        message={message}
                        isOwnMessage={isOwn}
                        isSeenByOther={isSeenByOther}
                        showSeenText={message._id === latestSeenOwnMessageId}
                        onEdit={
                          isOwn ? () => handleStartEdit(message) : undefined
                        }
                        onDeleteForMe={() => setDeleteForMeTarget(message)}
                        onRecall={
                          isOwn ? () => setRecallTarget(message) : undefined
                        }
                      />
                    )}
                  </div>
                );
              })
            )}

            {isTyping && (
              <div className="inline-flex rounded-full border border-orange-100 bg-white px-3 py-2 text-xs font-medium text-muted shadow-sm">
                Đang nhập...
              </div>
            )}

            <div ref={messageEndRef} />
          </div>

          {previewImage && (
            <div className="border-t border-line/70 bg-white px-4 py-4">
              <div className="flex flex-col gap-3 rounded-3xl border border-orange-100 bg-orange-50/60 p-3 sm:flex-row sm:items-center">
                <img
                  src={previewImage}
                  alt="preview"
                  className="max-h-40 w-full rounded-2xl object-cover sm:w-40"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Ảnh sẵn sàng để gửi
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Bạn có thể xóa ảnh này trước khi gửi tin nhắn.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearSelectedImage}
                >
                  Xóa ảnh
                </Button>
              </div>
            </div>
          )}

          <form
            className="border-t border-line/80 bg-white px-4 py-4"
            onSubmit={handleSendMessage}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={handleChooseImage}
              >
                <ImagePlus size={18} />
              </Button>

              <Input
                type="text"
                placeholder="Nhập tin nhắn..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />

              <Button type="submit" disabled={sending} className="shrink-0">
                <SendHorizontal size={16} />
                {sending ? "Đang gửi..." : "Gửi"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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

export default ChatBox;
