import { useEffect, useState } from "react";
import { ImagePlus, UserRound } from "lucide-react";
import { updateMeApi } from "../../services/authService";
import { uploadImageApi } from "../../services/uploadService";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

function EditProfileModal({ open, onClose, user, onUpdated }) {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    bio: "",
    avatar: "",
    coverImage: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFormData({
      fullName: user.fullName || "",
      username: user.username || "",
      bio: user.bio || "",
      avatar: user.avatar || "",
      coverImage: user.coverImage || "",
    });
  }, [user, open]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const res = await uploadImageApi(file);
      setFormData((prev) => ({ ...prev, avatar: res.data.url }));
    } catch {
      alert("Upload avatar that bai");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      const res = await uploadImageApi(file);
      setFormData((prev) => ({ ...prev, coverImage: res.data.url }));
    } catch {
      alert("Upload anh bia that bai");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      const res = await updateMeApi(formData);
      onUpdated(res.data);
      onClose();
    } catch (error) {
      alert(error?.response?.data?.message || "Cap nhat that bai");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose?.()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa thông tin</DialogTitle>
          <DialogDescription>Cập nhật hồ sơ của bạn.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[160px,1fr]">
            <div className="space-y-3">
              <div className="text-sm font-semibold text-foreground">
                Ảnh đại diện
              </div>
              <Avatar className="h-24 w-24 border border-orange-100">
                <AvatarImage src={formData.avatar} alt="avatar-preview" />
                <AvatarFallback>
                  <UserRound size={26} />
                </AvatarFallback>
              </Avatar>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-orange-50 px-3 py-2 text-sm font-medium text-primary hover:bg-orange-100">
                <ImagePlus size={16} />
                <span>{uploadingAvatar ? "Đang tải..." : "Đổi ảnh"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Họ và tên
                </label>
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Họ và tên"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Tài khoản
                </label>
                <Input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Tài khoản"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Giới thiệu
                </label>
                <Textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Giới thiệu ngắn gọn về bản thân"
                  className="min-h-28"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-foreground">
                  Ảnh bìa
                </div>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-orange-50 px-3 py-2 text-sm font-medium text-primary hover:bg-orange-100">
                <ImagePlus size={16} />
                <span>{uploadingCover ? "Đang tải..." : "Đổi ảnh bìa"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                />
              </label>
            </div>

            {formData.coverImage ? (
              <img
                src={formData.coverImage}
                alt="cover-preview"
                className="h-44 w-full rounded-2xl border border-line object-cover"
              />
            ) : (
              <div className="flex h-44 items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-orange-50 text-sm text-muted">
                Chưa có ảnh bìa
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang cập nhật..." : "Lưu"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditProfileModal;
