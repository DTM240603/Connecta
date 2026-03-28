import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import PostCard from "../../components/post/PostCard";
import { getMeApi } from "../../services/authService";
import { getPostsByUserApi } from "../../services/postService";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await getMeApi();
      const me = res.data;
      setUser(me);
      return me;
    } catch (error) {
      console.error(error);
      alert("Không lấy được thông tin người dùng");
      return null;
    }
  };

  const fetchMyPosts = async (userId) => {
    try {
      setLoadingPosts(true);
      const res = await getPostsByUserApi(userId);
      setPosts(res.data || []);
    } catch (error) {
      console.error(error);
      alert("Không lấy được bài viết của bạn");
    } finally {
      setLoadingPosts(false);
    }
  };

  const initData = async () => {
    try {
      setLoading(true);
      const me = await fetchMe();
      if (me?._id) {
        await fetchMyPosts(me._id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  const handleRefreshPosts = async () => {
    if (!user?._id) return;
    await fetchMyPosts(user._id);
  };

  if (loading) {
    return <div className="loading-page">Đang tải trang cá nhân...</div>;
  }

  return (
    <MainLayout user={user} onUserUpdated={setUser}>
      <div className="profile-page">
        <div className="card profile-card">
          <div className="cover-wrapper">
            <img
              className="cover-image"
              src={user?.coverImage || "https://picsum.photos/1200/300"}
              alt="cover"
            />
          </div>

          <div className="profile-top">
            <img
              className="profile-avatar"
              src={user?.avatar || "https://i.pravatar.cc/300"}
              alt="avatar"
            />

            <div>
              <h2>{user?.fullName}</h2>
              <p className="muted">@{user?.username}</p>
              <p className="profile-bio">{user?.bio || "Chưa có mô tả"}</p>

              <div className="profile-stats">
                <span>
                  <strong>{user?.followers?.length || 0}</strong> followers
                </span>
                <span>
                  <strong>{user?.following?.length || 0}</strong> following
                </span>
                <span>
                  <strong>{posts?.length || 0}</strong> posts
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Bài viết của tôi</h2>
        </div>

        {loadingPosts ? (
          <div className="card">Đang tải bài viết...</div>
        ) : posts.length === 0 ? (
          <div className="card">Bạn chưa có bài viết nào</div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={user}
              onRefresh={handleRefreshPosts}
            />
          ))
        )}
      </div>
    </MainLayout>
  );
}

export default ProfilePage;
