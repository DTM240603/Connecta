import { FileText, Search, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const truncateText = (value, maxLength = 90) => {
  if (!value) return "";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
};

function SearchDropdown({
  open,
  loading,
  keyword,
  results,
  onSelectUser,
  onSelectPost,
}) {
  if (!open) return null;

  const users = results?.users || [];
  const posts = results?.posts || [];
  const hasResults = users.length > 0 || posts.length > 0;

  return (
    <div className="absolute left-0 top-[calc(100%+0.6rem)] z-50 w-full overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
      {loading ? (
        <div className="flex items-center gap-3 px-4 py-4 text-sm text-muted">
          <Search size={16} className="text-primary" />
          Đang tìm kiếm...
        </div>
      ) : !keyword.trim() ? null : !hasResults ? (
        <div className="flex items-center gap-3 px-4 py-5 text-sm text-muted">
          <Search size={16} className="text-primary" />
          Không tìm thấy kết quả
        </div>
      ) : (
        <div className="max-h-[28rem] overflow-y-auto py-2">
          {users.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                <Users size={13} />
                Mọi người
              </div>

              <div className="space-y-1 px-2 pb-2">
                {users.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-orange-50"
                    onClick={() => onSelectUser?.(user)}
                  >
                    <Avatar className="h-10 w-10 border border-orange-100">
                      <AvatarImage
                        src={user.avatar || ""}
                        alt={user.fullName}
                      />
                      <AvatarFallback>
                        {user.fullName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
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
            </div>
          )}

          {posts.length > 0 && (
            <div
              className={users.length > 0 ? "border-t border-line pt-2" : ""}
            >
              <div className="flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                <FileText size={13} />
                Bài viết
              </div>

              <div className="space-y-1 px-2 pb-2">
                {posts.map((post) => (
                  <button
                    key={post._id}
                    type="button"
                    className="flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-orange-50"
                    onClick={() => onSelectPost?.(post)}
                  >
                    {post.image ? (
                      <img
                        src={post.image}
                        alt="post"
                        className="h-12 w-12 shrink-0 rounded-2xl border border-orange-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-primary">
                        <FileText size={18} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm text-foreground">
                        {truncateText(post.content)}
                      </div>
                      <div className="mt-1 truncate text-xs text-muted">
                        {post.author?.fullName || "Người dùng"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchDropdown;
