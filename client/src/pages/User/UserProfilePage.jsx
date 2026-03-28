import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import PostCard from "../../components/post/PostCard";
import {
  getMeApi,
  getUserProfileApi,
  toggleFollowApi,
} from "../../services/authService";
import { createOrGetConversationApi } from "../../services/chatService";
import { getPostsByUserApi } from "../../services/postService";

function UserProfilePage() {
  const { id } = useParams();

  const [me, setMe] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [meRes, userRes, postRes] = await Promise.all([
        getMeApi(),
        getUserProfileApi(id),
        getPostsByUserApi(id),
      ]);

      setMe(meRes.data);
      setProfileUser(userRes.data);
      setPosts(postRes.data || []);
    } catch (error) {
      console.error(error);
      alert("Không lấy được dữ liệu trang cá nhân");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleRefreshPosts = async () => {
    const postRes = await getPostsByUserApi(id);
    setPosts(postRes.data || []);
  };

  const handleToggleFollow = async () => {
    try {
      setFollowLoading(true);
      await toggleFollowApi(id);
      await fetchData();
    } catch (error) {
      alert(error?.response?.data?.message || "Thao tác follow thất bại");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleStartChat = async () => {
    try {
      setChatLoading(true);

      const res = await createOrGetConversationApi(id);
      const conversation = res.data;

      window.dispatchEvent(
        new CustomEvent("openChat", {
          detail: conversation,
        })
      );
    } catch (error) {
      alert(error?.response?.data?.message || "Không thể bắt đầu cuộc trò chuyện");
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-page">Đang tải trang cá nhân...</div>;
  }

  const isOwnProfile = me?._id === profileUser?._id;

  const isFollowing = me?.following?.some((userId) =>
    typeof userId === "string"
      ? userId === profileUser?._id
      : userId?._id === profileUser?._id
  );

  return (
    <MainLayout user={me} onUserUpdated={setMe}>
      <div className="profile-page">
        <div className="card profile-card">
          <div className="cover-wrapper">
            <img
              className="cover-image"
              src={profileUser?.coverImage || "https://picsum.photos/1200/300"}
              alt="cover"
            />
          </div>

          <div className="profile-top">
            <img
              className="profile-avatar"
              src={profileUser?.avatar || "https://i.pravatar.cc/300"}
              alt="avatar"
            />

            <div className="profile-main-info">
              <h2>{profileUser?.fullName}</h2>
              <p className="muted">@{profileUser?.username}</p>
              <p className="profile-bio">{profileUser?.bio || "Chưa có mô tả"}</p>

              <div className="profile-stats">
                <span>
                  <strong>{profileUser?.followers?.length || 0}</strong> followers
                </span>
                <span>
                  <strong>{profileUser?.following?.length || 0}</strong> following
                </span>
              </div>

              {!isOwnProfile && (
                <div className="profile-action-row">
                  <button
                    className={`btn ${isFollowing ? "btn-outline" : "btn-primary"}`}
                    onClick={handleToggleFollow}
                    disabled={followLoading}
                  >
                    {followLoading
                      ? "Đang xử lý..."
                      : isFollowing
                        ? "Bỏ theo dõi"
                        : "Theo dõi"}
                  </button>

                  <button
                    className="btn btn-outline"
                    onClick={handleStartChat}
                    disabled={chatLoading}
                  >
                    {chatLoading ? "Đang mở..." : "Nhắn tin"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Bài viết của {profileUser?.fullName}</h2>
        </div>

        {posts.length === 0 ? (
          <div className="card">Người dùng này chưa có bài viết nào</div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={me}
              onRefresh={handleRefreshPosts}
            />
          ))
        )}
      </div>
    </MainLayout>
  );
}

export default UserProfilePage;