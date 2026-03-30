import { ImagePlus, SendHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { uploadPostImageApi } from "../../services/postService";

function CreatePost({ onCreate }) {
  const [content, setContent] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setPreviewImage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && !selectedImage) {
      alert("Vui long nhap noi dung hoac chon anh");
      return;
    }

    try {
      setLoading(true);
      let imageUrl = "";

      if (selectedImage) {
        setUploadingImage(true);
        const uploadRes = await uploadPostImageApi(selectedImage);
        imageUrl = uploadRes.data.url;
      }

      await onCreate({
        content: content.trim(),
        image: imageUrl,
      });

      setContent("");
      clearSelectedImage();
    } catch (error) {
      alert(error?.response?.data?.message || "Dang bai that bai");
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  return (
    <Card className="create-post-card">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Tạo bài viết
            </h2>
            <p className="mt-1 text-sm text-muted">
              Chia sẻ suy nghĩ, hình ảnh hoặc cập nhật mới của bạn.
            </p>
          </div>
          {selectedImage && <Badge variant="default">Đã chọn ảnh</Badge>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            className="min-h-[120px] rounded-2xl bg-orange-50/50"
            placeholder="Bạn đang nghĩ gì?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-orange-50 px-3 py-2 text-sm font-medium text-primary hover:bg-orange-100">
              <ImagePlus size={16} />
              <span>Thêm ảnh</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>

            <Button type="submit" disabled={loading}>
              <SendHorizontal size={16} />
              {loading
                ? uploadingImage
                  ? "Đang tải..."
                  : "Đang đăng..."
                : "Đăng"}
            </Button>
          </div>
        </form>

        {previewImage ? (
          <div className="space-y-3 rounded-2xl border border-orange-100 bg-orange-50/40 p-3">
            <img
              src={previewImage}
              alt="preview"
              className="max-h-[340px] w-full rounded-2xl object-cover"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={clearSelectedImage}
              >
                Xóa ảnh
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default CreatePost;
