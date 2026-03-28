import { useState } from "react";
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
      alert("Vui lòng nhập nội dung hoặc chọn ảnh");
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
      alert(error?.response?.data?.message || "Đăng bài thất bại");
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  return (
    <div className="card create-post-card">
      <h2>Tạo bài viết</h2>

      <form onSubmit={handleSubmit} className="form">
        <textarea
          className="input textarea"
          placeholder="Bạn đang nghĩ gì?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <div className="upload-group">
          <label className="upload-label">Chọn ảnh từ máy</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </div>

        {previewImage ? (
          <div className="create-post-preview-wrap">
            <img
              src={previewImage}
              alt="preview"
              className="create-post-preview-image"
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={clearSelectedImage}
            >
              Xóa ảnh
            </button>
          </div>
        ) : null}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading
            ? uploadingImage
              ? "Đang upload ảnh..."
              : "Đang đăng..."
            : "Đăng bài"}
        </button>
      </form>
    </div>
  );
}

export default CreatePost;
