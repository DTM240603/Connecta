import { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, MessageCircleMore, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import PostCard from "../../components/post/PostCard";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
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
  const [activeTab, setActiveTab] = useState("posts");
  const [openFollowModal, setOpenFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState("followers");
  const [followLoadingId, setFollowLoadingId] = useState(null);
  const postsSectionRef = useRef(null);

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
      alert("Khong lay duoc du lieu trang ca nhan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleRefreshPosts = async () => {
    const [userRes, postRes] = await Promise.all([
      getUserProfileApi(id),
      getPostsByUserApi(id),
    ]);
    setProfileUser(userRes.data);
    setPosts(postRes.data || []);
  };

  const handleToggleFollow = async () => {
    try {
      setFollowLoading(true);
      await toggleFollowApi(id);
      await fetchData();
    } catch (error) {
      alert(error?.response?.data?.message || "Thao tac follow that bai");
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
        new CustomEvent("openChat", { detail: conversation }),
      );
    } catch (error) {
      alert(
        error?.response?.data?.message || "Khong the bat dau cuoc tro chuyen",
      );
    } finally {
      setChatLoading(false);
    }
  };

  const imagePosts = useMemo(() => posts.filter((post) => post.image), [posts]);
  const isOwnProfile = me?._id === profileUser?._id;
  const isFollowing = me?.following?.some((userId) =>
    typeof userId === "string"
      ? userId === profileUser?._id
      : userId?._id === profileUser?._id,
  );
  const followingIds = useMemo(
    () =>
      (me?.following || []).map((item) =>
        typeof item === "string" ? item : item._id,
      ),
    [me],
  );
  const followersList = useMemo(
    () => (Array.isArray(profileUser?.followers) ? profileUser.followers : []),
    [profileUser],
  );
  const followingList = useMemo(
    () => (Array.isArray(profileUser?.following) ? profileUser.following : []),
    [profileUser],
  );
  const displayUsers =
    followModalType === "followers" ? followersList : followingList;

  const handleScrollToPosts = () => {
    setActiveTab("posts");
    setTimeout(() => {
      postsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleToggleFollowInModal = async (e, targetUserId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setFollowLoadingId(targetUserId);
      await toggleFollowApi(targetUserId);
      await fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setFollowLoadingId(null);
    }
  };

  if (loading) {
    return <div className="loading-page">Dang tai trang ca nhan...</div>;
  }

  return (
    <MainLayout user={me} onUserUpdated={setMe}>
      <div className="mx-auto w-full max-w-[1180px] space-y-5">
        <Card className="overflow-hidden">
          <div className="h-56 w-full bg-orange-50">
            <img
              className="h-full w-full object-cover"
              src={profileUser?.coverImage || "https://picsum.photos/1200/320"}
              alt="cover"
            />
          </div>

          <CardContent className="pt-0">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
              <Avatar className="-mt-14 h-32 w-32 border-4 border-white shadow-md">
                <AvatarImage
                  src={profileUser?.avatar || ""}
                  alt={profileUser?.fullName || "avatar"}
                />
                <AvatarFallback>
                  {profileUser?.fullName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {profileUser?.fullName}
                  </h1>
                  <div className="mt-1 text-sm text-muted">
                    @{profileUser?.username}
                  </div>
                </div>
                <p className="max-w-3xl text-sm leading-6 text-muted">
                  {profileUser?.bio ||
                    "Người dùng này chưa cập nhật phần giới thiệu."}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <button
                    type="button"
                    className="rounded-xl bg-orange-50 px-3 py-2 hover:bg-orange-100"
                    onClick={() => {
                      setFollowModalType("followers");
                      setOpenFollowModal(true);
                    }}
                  >
                    <span className="font-semibold text-foreground">
                      {profileUser?.followers?.length || 0}
                    </span>{" "}
                    <span className="text-muted">người theo dõi</span>
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-orange-50 px-3 py-2 hover:bg-orange-100"
                    onClick={() => {
                      setFollowModalType("following");
                      setOpenFollowModal(true);
                    }}
                  >
                    <span className="font-semibold text-foreground">
                      {profileUser?.following?.length || 0}
                    </span>{" "}
                    <span className="text-muted">đang theo dõi</span>
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-orange-50 px-3 py-2 hover:bg-orange-100"
                    onClick={handleScrollToPosts}
                  >
                    <span className="font-semibold text-foreground">
                      {posts.length || 0}
                    </span>{" "}
                    <span className="text-muted">bài viết</span>
                  </button>
                </div>
              </div>

              {!isOwnProfile && (
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    onClick={handleToggleFollow}
                    disabled={followLoading}
                  >
                    {followLoading
                      ? "Đang xử lý..."
                      : isFollowing
                        ? "Bỏ theo dõi"
                        : "Theo dõi"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleStartChat}
                    disabled={chatLoading}
                  >
                    <MessageCircleMore size={16} />
                    {chatLoading ? "Đang mở..." : "Nhắn tin"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="posts">Bài viết</TabsTrigger>
            <TabsTrigger value="photos">Ảnh</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <div className="grid w-full grid-cols-1 gap-5 xl:grid-cols-[420px_minmax(0,720px)] xl:items-start xl:justify-between">
              <aside className="w-full max-w-[420px] space-y-4 xl:sticky xl:top-[88px] xl:self-start">
                <Card>
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted">
                      <Users size={16} className="text-primary" />
                      Thông tin
                    </div>

                    <div className="space-y-3 text-sm text-muted">
                      <div>
                        <div className="font-medium text-foreground">
                          {profileUser?.fullName}
                        </div>
                        <div className="mt-1">@{profileUser?.username}</div>
                      </div>

                      <div className="rounded-2xl bg-orange-50 px-4 py-3">
                        {profileUser?.bio ||
                          "Người dùng này chưa cập nhật phần giới thiệu."}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-2xl border border-orange-100 px-3 py-3">
                          <div className="text-base font-semibold text-foreground">
                            {profileUser?.followers?.length || 0}
                          </div>
                          <div className="mt-1 text-[11px] uppercase tracking-[0.14em]">
                            Followers
                          </div>
                        </div>
                        <div className="rounded-2xl border border-orange-100 px-3 py-3">
                          <div className="text-base font-semibold text-foreground">
                            {profileUser?.following?.length || 0}
                          </div>
                          <div className="mt-1 text-[11px] uppercase tracking-[0.14em]">
                            Following
                          </div>
                        </div>
                        <div className="rounded-2xl border border-orange-100 px-3 py-3">
                          <div className="text-base font-semibold text-foreground">
                            {posts.length || 0}
                          </div>
                          <div className="mt-1 text-[11px] uppercase tracking-[0.14em]">
                            Posts
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </aside>

              <section className="min-w-0">
                <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5 xl:max-w-none">
                  {posts.length === 0 ? (
                    <Card>
                      <CardContent className="py-10 text-center text-sm text-muted">
                        Người dùng này chưa có bài viết nào
                      </CardContent>
                    </Card>
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
              </section>
            </div>
          </TabsContent>

          <TabsContent value="photos">
            <div className="space-y-4">
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted">
                    <ImageIcon size={16} className="text-primary" />
                    Thư viện ảnh
                  </div>
                </CardContent>
              </Card>

              {imagePosts.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-muted">
                    Chưa có ảnh
                  </CardContent>
                </Card>
              ) : (
                <div className="profile-photo-grid">
                  {imagePosts.map((post) => (
                    <div key={post._id} className="profile-photo-item">
                      <img
                        src={post.image}
                        alt="post"
                        className="profile-photo-image"
                      />
                      <div className="profile-photo-overlay">
                        <div className="profile-photo-time">
                          {new Date(post.createdAt).toLocaleString("vi-VN")}
                        </div>
                        {post.content ? (
                          <div className="profile-photo-caption">
                            {post.content}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={openFollowModal} onOpenChange={setOpenFollowModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {followModalType === "followers"
                  ? "Người theo dõi"
                  : "Đang theo dõi"}
              </DialogTitle>
            </DialogHeader>

            <div className="follow-modal-list">
              {displayUsers.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted">
                  {followModalType === "followers"
                    ? "Chưa có ai"
                    : "Chưa theo dõi ai"}
                </div>
              ) : (
                displayUsers.map((person) => {
                  const personId =
                    typeof person === "string" ? person : person._id;
                  const fullName =
                    typeof person === "string"
                      ? "Người dùng"
                      : person.fullName || "Người dùng";
                  const username =
                    typeof person === "string" ? "" : person.username || "";
                  const avatar =
                    typeof person === "string" ? "" : person.avatar || "";
                  const isMe = personId === me?._id;
                  const isFollowingThisPerson = followingIds.includes(personId);

                  return (
                    <div key={personId} className="follow-modal-item">
                      <Link
                        to={`/users/${personId}`}
                        className="flex min-w-0 flex-1 items-center gap-3"
                        onClick={() => setOpenFollowModal(false)}
                      >
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={avatar} alt={fullName} />
                          <AvatarFallback>{fullName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">
                            {fullName}
                          </div>
                          <div className="truncate text-sm text-muted">
                            @{username}
                          </div>
                        </div>
                      </Link>

                      {!isMe && (
                        <Button
                          variant={
                            isFollowingThisPerson ? "outline" : "default"
                          }
                          size="sm"
                          disabled={followLoadingId === personId}
                          onClick={(e) =>
                            handleToggleFollowInModal(e, personId)
                          }
                        >
                          {followLoadingId === personId
                            ? "Đang xử lý..."
                            : isFollowingThisPerson
                              ? "Bỏ theo dõi"
                              : "Theo dõi"}
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

export default UserProfilePage;
