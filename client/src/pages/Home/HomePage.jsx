import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import MiniChatBox from "../../components/chat/MiniChatBox";
import CreatePost from "../../components/post/CreatePost";
import PostCard from "../../components/post/PostCard";
import OnlineUsersList from "../../components/user/OnlineUsersList";
import UserList from "../../components/user/UserList";
import { getMeApi, getUsersApi } from "../../services/authService";
import { createPostApi, getPostsApi } from "../../services/postService";
import { socket } from "../../services/socket";

function HomePage() {
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [chatTargetUser, setChatTargetUser] = useState(null);

  const fetchMe = async () => {
    try {
      setLoadingUser(true);
      const res = await getMeApi();
      setUser(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await getUsersApi();
      setAllUsers(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      const res = await getPostsApi();
      setPosts(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleCreatePost = async (payload) => {
    await createPostApi(payload);
    await fetchPosts();
  };

  useEffect(() => {
    fetchMe();
    fetchPosts();
    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (!user?._id) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("addUser", user._id);

    socket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users || []);
    });

    return () => {
      socket.off("getOnlineUsers");
    };
  }, [user?._id]);

  if (loadingUser) {
    return <div className="loading-page">Đang tải dữ liệu người dùng...</div>;
  }

  return (
    <MainLayout user={user} onUserUpdated={setUser}>
      <div className="home-layout">
        <aside className="home-left">
          <UserList currentUser={user} onRefreshUser={fetchMe} />
        </aside>

        <section className="home-center">
          <CreatePost onCreate={handleCreatePost} />

          <div className="card">
            <h2>Bảng tin</h2>
          </div>

          {loadingPosts ? (
            <div className="card">Đang tải bài viết...</div>
          ) : posts.length === 0 ? (
            <div className="card">Chưa có bài viết nào</div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUser={user}
                onRefresh={fetchPosts}
              />
            ))
          )}
        </section>

        <aside className="home-right">
          <OnlineUsersList
            users={allUsers}
            onlineUsers={onlineUsers}
            currentUser={user}
            onOpenChat={setChatTargetUser}
          />
        </aside>
      </div>

      {chatTargetUser && (
        <MiniChatBox
          currentUser={user}
          targetUser={chatTargetUser}
          onlineUsers={onlineUsers}
          onClose={() => setChatTargetUser(null)}
        />
      )}
    </MainLayout>
  );
}

export default HomePage;
