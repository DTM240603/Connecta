import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUsersApi, toggleFollowApi } from "../../services/authService";

function UserList({ currentUser, onRefreshUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsersApi();
      setUsers(res.data || []);
    } catch (error) {
      console.error(error);
      alert("Không lấy được danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleFollow = async (userId) => {
    try {
      setProcessingId(userId);
      await toggleFollowApi(userId);
      await fetchUsers();
      await onRefreshUser();
    } catch (error) {
      alert(error?.response?.data?.message || "Thao tác follow thất bại");
    } finally {
      setProcessingId("");
    }
  };

  return (
    <div className="card">
      <h2>Gợi ý kết bạn</h2>

      {loading ? (
        <p>Đang tải danh sách người dùng...</p>
      ) : users.length === 0 ? (
        <p className="muted">Chưa có người dùng nào khác</p>
      ) : (
        <div className="user-list">
          {users.map((user) => {
            const isFollowing = currentUser?.following?.some(
              (id) => id === user._id || id?._id === user._id,
            );

            return (
              <div key={user._id} className="user-item">
                <Link to={`/users/${user._id}`} className="user-info-link">
                  <div className="user-info">
                    <img
                      src={user.avatar || "https://i.pravatar.cc/150"}
                      alt="avatar"
                      className="user-avatar"
                    />

                    <div>
                      <h4>{user.fullName}</h4>
                      <p className="muted">@{user.username}</p>
                      <p className="muted small-text">
                        Followers: {user.followers?.length || 0}
                      </p>
                    </div>
                  </div>
                </Link>

                <div className="user-actions">
                  <button
                    className={`btn ${isFollowing ? "btn-outline" : "btn-primary"}`}
                    onClick={() => handleToggleFollow(user._id)}
                    disabled={processingId === user._id}
                  >
                    {processingId === user._id
                      ? "Đang xử lý..."
                      : isFollowing
                        ? "Bỏ theo dõi"
                        : "Theo dõi"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UserList;
