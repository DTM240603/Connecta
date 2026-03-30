import { useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { updatePostApi, uploadPostImageApi } from "../../services/postService";

function EditPostModal({ open, onClose, post, onUpdated }) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (post) {
      setContent(post.content || "");
      setImage(post.image || "");
      setPreviewImage(post.image || "");
      setSelectedImage(null);
    }
  }, [post, open]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImage("");
    setPreviewImage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      let finalImage = image;

      if (selectedImage) {
        const uploadRes = await uploadPostImageApi(selectedImage);
        finalImage = uploadRes.data.url;
      }

      const res = await updatePostApi(post._id, {
        content,
        image: finalImage,
      });

      onUpdated(res.data);
      onClose();
    } catch (error) {
      alert(error?.response?.data?.message || "Cập nhật bài viết thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa bài viết</DialogTitle>
          <DialogDescription>
            Cập nhật nội dung hoặc hình ảnh mà không thay đổi logic bài viết.
          </DialogDescription>
        </DialogHeader>

        {post ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              className="min-h-[140px]"
              placeholder="Cập nhật nội dung bài viết..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-3xl border border-dashed border-orange-200 bg-orange-50/60 px-4 py-4 text-sm font-medium text-primary transition-colors hover:bg-orange-100/70">
              <ImagePlus size={18} />
              Chọn ảnh mới
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            {previewImage ? (
              <div className="overflow-hidden rounded-3xl border border-orange-100 bg-orange-50/50 p-3">
                <img
                  src={previewImage}
                  alt="preview"
                  className="max-h-[380px] w-full rounded-2xl object-cover"
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveImage}
                  >
                    Xóa ảnh
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang cập nhật..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default EditPostModal;
