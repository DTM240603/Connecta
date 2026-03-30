import { useEffect, useMemo, useState } from "react";
import { MessageSquareMore, Radio } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ChatBox from "../../components/chat/ChatBox";
import ConversationList from "../../components/chat/ConversationList";
import MainLayout from "../../components/layout/MainLayout";
import { Card, CardContent } from "../../components/ui/card";
import { getMeApi } from "../../services/authService";
import { getMyConversationsApi } from "../../services/chatService";
import { socket } from "../../services/socket";
import { dedupeConversationsForUser } from "../../utils/chat";

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
      setConversations(dedupeConversationsForUser(res.data || [], currentUser?._id));
    } catch (error) {
      console.error(error);
      alert("Khong lay duoc danh sach cuoc tro chuyen");
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
    socket.on("getOnlineUsers", (users) => setOnlineUsers(users || []));

    return () => socket.off("getOnlineUsers");
  }, [currentUser?._id]);

  const selectedConversation = useMemo(() => {
    if (!queryConversationId) return null;
    return conversations.find((item) => item._id === queryConversationId) || null;
  }, [conversations, queryConversationId]);

  const handleSelectConversation = (conversation) => {
    setSearchParams({ conversationId: conversation._id });
  };

  if (loadingUser) {
    return <div className="loading-page">Dang tai du lieu nguoi dung...</div>;
  }

  return (
    <MainLayout user={currentUser}>
      <div className="space-y-5">
        <Card>
          <CardContent className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                <MessageSquareMore size={16} />
                Tin nhan
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Khong gian tro chuyen</h1>
              <p className="mt-1 text-sm text-muted">
                Tin nhan duoc giu theo logic cu, nhung giao dien da duoc lam lai de gon hon va de doc hon.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-medium text-primary">
              <Radio size={16} />
              {onlineUsers.length} nguoi dang online
            </div>
          </CardContent>
        </Card>

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
      </div>
    </MainLayout>
  );
}

export default MessagesPage;
