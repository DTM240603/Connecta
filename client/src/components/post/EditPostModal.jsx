import { useEffect, useState } from "react";
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

    if (!open || !post) return null;

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
        <div className="modal-overlay">
            <div className="modal-card">
                <div className="modal-header">
                    <h2>Chỉnh sửa bài viết</h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="form">
                    <textarea
                        className="input textarea"
                        placeholder="Cập nhật nội dung bài viết..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />

                    <div className="upload-group">
                        <label className="upload-label">Chọn ảnh mới</label>
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
                                onClick={handleRemoveImage}
                            >
                                Xóa ảnh
                            </button>
                        </div>
                    ) : null}

                    <button className="btn btn-primary" type="submit" disabled={submitting}>
                        {submitting ? "Đang cập nhật..." : "Lưu thay đổi"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default EditPostModal;