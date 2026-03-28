function OnlineUsersList({
  users = [],
  onlineUsers = [],
  currentUser,
  onOpenChat,
}) {
  const mutualUsers = users.filter((user) => {
    const isOnline = onlineUsers.includes(user._id);

    const iFollowThem = currentUser?.following?.some(
      (id) => id === user._id || id?._id === user._id,
    );

    const theyFollowMe = currentUser?.followers?.some(
      (id) => id === user._id || id?._id === user._id,
    );

    return isOnline && iFollowThem && theyFollowMe;
  });

  return (
    <div className="card">
      <h2>Đang online</h2>

      {mutualUsers.length === 0 ? (
        <p className="muted">Chưa có bạn bè online</p>
      ) : (
        <div className="online-user-list">
          {mutualUsers.map((user) => (
            <button
              key={user._id}
              className="online-user-item"
              onClick={() => onOpenChat(user)}
            >
              <div className="online-avatar-wrap">
                <img
                  src={user.avatar || "https://i.pravatar.cc/100"}
                  alt="avatar"
                  className="online-user-avatar"
                />
                <span className="online-dot"></span>
              </div>

              <div className="online-user-info">
                <div className="online-user-name">{user.fullName}</div>
                <div className="muted">@{user.username}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default OnlineUsersList;
