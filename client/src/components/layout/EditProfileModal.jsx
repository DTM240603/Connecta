import { useEffect, useState } from "react";
import { updateMeApi } from "../../services/authService";
import { uploadImageApi } from "../../services/uploadService";

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
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        username: user.username || "",
        bio: user.bio || "",
        avatar: user.avatar || "",
        coverImage: user.coverImage || "",
      });
    }
  }, [user, open]);

  if (!open) return null;

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
      setFormData((prev) => ({
        ...prev,
        avatar: res.data.url,
      }));
    } catch {
      alert("Upload avatar thất bại");
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
      setFormData((prev) => ({
        ...prev,
        coverImage: res.data.url,
      }));
    } catch {
      alert("Upload ảnh bìa thất bại");
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
      alert(error?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2>Chỉnh sửa thông tin</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <input
            className="input"
            type="text"
            name="fullName"
            placeholder="Họ và tên"
            value={formData.fullName}
            onChange={handleChange}
          />

          <input
            className="input"
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
          />

          <textarea
            className="input textarea"
            name="bio"
            placeholder="Giới thiệu bản thân"
            value={formData.bio}
            onChange={handleChange}
          />

          <div className="upload-group">
            <label className="upload-label">Chọn avatar</label>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} />
            {uploadingAvatar && <p className="muted">Đang upload avatar...</p>}
            {formData.avatar ? (
              <img
                src={formData.avatar}
                alt="avatar-preview"
                className="modal-preview-image avatar-preview"
              />
            ) : null}
          </div>

          <div className="upload-group">
            <label className="upload-label">Chọn ảnh bìa</label>
            <input type="file" accept="image/*" onChange={handleCoverUpload} />
            {uploadingCover && <p className="muted">Đang upload ảnh bìa...</p>}
            {formData.coverImage ? (
              <img
                src={formData.coverImage}
                alt="cover-preview"
                className="modal-preview-image cover-preview"
              />
            ) : null}
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Đang cập nhật..." : "Lưu thay đổi"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;
