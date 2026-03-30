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
    <div className="card p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted">
        Đang online
      </h2>

      {mutualUsers.length === 0 ? (
        <p className="text-sm text-muted">Chưa có bạn bè online</p>
      ) : (
        <div className="space-y-2">
          {mutualUsers.map((user) => (
            <button
              key={user._id}
              className="flex w-full items-center gap-2.5 rounded-2xl border border-orange-100/70 bg-white px-2.5 py-2 text-left transition hover:bg-orange-50/60"
              onClick={() => onOpenChat(user)}
            >
              <div className="relative shrink-0">
                <img
                  src={user.avatar || "https://i.pravatar.cc/100"}
                  alt="avatar"
                  className="h-11 w-11 rounded-full border border-orange-100 object-cover"
                />
                <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500"></span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-foreground">
                  {user.fullName}
                </div>
                <div className="truncate text-xs text-muted">
                  @{user.username}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default OnlineUsersList;
