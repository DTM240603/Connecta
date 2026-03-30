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
    <div className="card p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted">
        Gợi ý
      </h2>

      {loading ? (
        <p className="text-sm text-muted">Đang tải danh sách người dùng...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted">Chưa có người dùng nào khác</p>
      ) : (
        <div className="space-y-2.5">
          {users.map((user) => {
            const isFollowing = currentUser?.following?.some(
              (id) => id === user._id || id?._id === user._id,
            );

            return (
              <div
                key={user._id}
                className="flex items-center gap-2.5 rounded-2xl border border-orange-100/70 bg-white px-2.5 py-2.5"
              >
                <Link
                  to={`/users/${user._id}`}
                  className="min-w-0 flex flex-1 items-center gap-2.5"
                >
                  <img
                    src={user.avatar || "https://i.pravatar.cc/150"}
                    alt="avatar"
                    className="h-12 w-12 rounded-full border border-orange-100 object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-semibold text-foreground">
                      {user.fullName}
                    </h4>
                    <p className="truncate text-xs text-muted">
                      @{user.username}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted">
                      {user.followers?.length || 0} người theo dõi
                    </p>
                  </div>
                </Link>

                <button
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    isFollowing
                      ? "border border-orange-200 bg-white text-primary hover:bg-orange-50"
                      : "bg-primary text-white hover:bg-orange-600"
                  }`}
                  onClick={() => handleToggleFollow(user._id)}
                  disabled={processingId === user._id}
                >
                  {processingId === user._id
                    ? "Đang xử lý"
                    : isFollowing
                      ? "Bỏ theo dõi"
                      : "Theo dõi"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UserList;
