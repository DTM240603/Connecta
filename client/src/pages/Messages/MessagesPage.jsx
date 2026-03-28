import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ConversationList from "../../components/chat/ConversationList";
import ChatBox from "../../components/chat/ChatBox";
import MainLayout from "../../components/layout/MainLayout";
import { getMeApi } from "../../services/authService";
import { getMyConversationsApi } from "../../services/chatService";
import { socket } from "../../services/socket";

function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryConversationId = searchParams.get("conversationId");

  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const fetchMe = async () => {
    try {
      setLoadingUser(true);
      const res = await getMeApi();
      setCurrentUser(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const res = await getMyConversationsApi();
      setConversations(res.data || []);
    } catch (error) {
      console.error(error);
      alert("Không lấy được danh sách cuộc trò chuyện");
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    fetchMe();
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!currentUser?._id) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("addUser", currentUser._id);

    socket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users || []);
    });

    return () => {
      socket.off("getOnlineUsers");
    };
  }, [currentUser?._id]);

  const selectedConversation = useMemo(() => {
    if (!queryConversationId) return null;
    return (
      conversations.find((item) => item._id === queryConversationId) || null
    );
  }, [conversations, queryConversationId]);

  const handleSelectConversation = (conversation) => {
    setSearchParams({ conversationId: conversation._id });
  };

  if (loadingUser) {
    return <div className="loading-page">Đang tải dữ liệu người dùng...</div>;
  }

  return (
    <MainLayout user={currentUser}>
      <div className="messages-layout">
        <ConversationList
          conversations={conversations}
          currentUser={currentUser}
          selectedConversationId={selectedConversation?._id}
          onSelectConversation={handleSelectConversation}
          loading={loadingConversations}
          onlineUsers={onlineUsers}
        />

        <ChatBox
          conversation={selectedConversation}
          currentUser={currentUser}
          onRefreshConversations={fetchConversations}
          onlineUsers={onlineUsers}
        />
      </div>
    </MainLayout>
  );
}

export default MessagesPage;
