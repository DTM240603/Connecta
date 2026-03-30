import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightPostId = searchParams.get("postId");
  const highlightCommentId = searchParams.get("commentId");
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [chatTargetUser, setChatTargetUser] = useState(null);
  const clearHighlightTimeoutRef = useRef(null);

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
    socket.on("getOnlineUsers", (users) => setOnlineUsers(users || []));

    return () => socket.off("getOnlineUsers");
  }, [user?._id]);

  useEffect(() => {
    if (!highlightPostId && !highlightCommentId) return;

    if (clearHighlightTimeoutRef.current) {
      clearTimeout(clearHighlightTimeoutRef.current);
    }

    clearHighlightTimeoutRef.current = setTimeout(() => {
      setSearchParams({});
    }, 4000);

    return () => clearTimeout(clearHighlightTimeoutRef.current);
  }, [highlightPostId, highlightCommentId, setSearchParams]);

  if (loadingUser) {
    return <div className="loading-page">Đang tải dữ liệu...</div>;
  }

  return (
    <MainLayout user={user} onUserUpdated={setUser}>
      <div className="mx-auto w-full max-w-[1360px]">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)_260px] xl:grid-cols-[280px_minmax(0,720px)_280px] xl:justify-center">
          <aside className="hidden min-w-0 lg:block lg:self-start lg:sticky lg:top-[88px]">
            <UserList currentUser={user} onRefreshUser={fetchMe} />
          </aside>

          <section className="min-w-0 w-full">
            <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5 lg:max-w-none">
              <CreatePost onCreate={handleCreatePost} />

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
                    highlightPostId={highlightPostId}
                    highlightCommentId={highlightCommentId}
                  />
                ))
              )}
            </div>
          </section>

          <aside className="hidden min-w-0 lg:block lg:self-start lg:sticky lg:top-[88px]">
            <OnlineUsersList
              users={allUsers}
              onlineUsers={onlineUsers}
              currentUser={user}
              onOpenChat={setChatTargetUser}
            />
          </aside>
        </div>
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
