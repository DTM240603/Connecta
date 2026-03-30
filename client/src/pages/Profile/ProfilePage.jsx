import { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, ImagePlus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import CreatePost from "../../components/post/CreatePost";
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
import { createPostApi, getPostsByUserApi } from "../../services/postService";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [openFollowModal, setOpenFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState("followers");
  const [followLoadingId, setFollowLoadingId] = useState(null);
  const postsSectionRef = useRef(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const meRes = await getMeApi();
      const me = meRes.data;
      const profileRes = await getUserProfileApi(me._id);
      const profileUser = profileRes.data;
      setUser(profileUser);
      const postRes = await getPostsByUserApi(me._id);
      setPosts(postRes.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePost = async (payload) => {
    try {
      await createPostApi(payload);
      await fetchData();
      setActiveTab("posts");
    } catch (error) {
      console.error(error);
    }
  };

  const handleRefreshPosts = async () => {
    if (!user?._id) return;

    try {
      const [profileRes, postRes] = await Promise.all([
        getUserProfileApi(user._id),
        getPostsByUserApi(user._id),
      ]);

      setUser(profileRes.data);
      setPosts(postRes.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const imagePosts = useMemo(() => posts.filter((post) => post.image), [posts]);
  const followingIds = useMemo(
    () =>
      (user?.following || []).map((item) =>
        typeof item === "string" ? item : item._id,
      ),
    [user],
  );
  const followersList = useMemo(
    () => (Array.isArray(user?.followers) ? user.followers : []),
    [user],
  );
  const followingList = useMemo(
    () => (Array.isArray(user?.following) ? user.following : []),
    [user],
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

  const handleToggleFollow = async (e, targetUserId) => {
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
    return <div className="loading-page">Đang tải...</div>;
  }

  return (
    <MainLayout user={user} onUserUpdated={setUser}>
      <div className="mx-auto w-full max-w-[1180px] space-y-5">
        <Card className="overflow-hidden">
          <div className="h-56 w-full bg-orange-50">
            <img
              className="h-full w-full object-cover"
              src={user?.coverImage || "https://picsum.photos/1200/320"}
              alt="cover"
            />
          </div>

          <CardContent className="pt-0">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
              <Avatar className="-mt-14 h-32 w-32 border-4 border-white shadow-md">
                <AvatarImage
                  src={user?.avatar || ""}
                  alt={user?.fullName || "avatar"}
                />
                <AvatarFallback>{user?.fullName?.[0] || "U"}</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {user?.fullName}
                  </h1>
                  <div className="mt-1 text-sm text-muted">
                    @{user?.username}
                  </div>
                </div>
                <p className="max-w-3xl text-sm leading-6 text-muted">
                  {user?.bio || "Chưa có mô tả."}
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
                      {user?.followers?.length || 0}
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
                      {user?.following?.length || 0}
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
                <CreatePost onCreate={handleCreatePost} />
              </aside>

              <section className="min-w-0">
                <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5 xl:max-w-none">
                  <Card ref={postsSectionRef}>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-muted">
                        <Users size={16} className="text-primary" />
                        Bài viết của tôi
                      </div>
                    </CardContent>
                  </Card>

                  {posts.length === 0 ? (
                    <Card>
                      <CardContent className="py-10 text-center text-sm text-muted">
                        Chưa có bài viết
                      </CardContent>
                    </Card>
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
                    Không có ảnh
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
                    ? "Chưa có ai theo dõi"
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
                  const isFollowing = followingIds.includes(personId);

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

                      {personId !== user?._id && (
                        <Button
                          variant={isFollowing ? "outline" : "default"}
                          size="sm"
                          disabled={followLoadingId === personId}
                          onClick={(e) => handleToggleFollow(e, personId)}
                        >
                          {followLoadingId === personId
                            ? "Đang xử lý..."
                            : isFollowing
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

export default ProfilePage;
