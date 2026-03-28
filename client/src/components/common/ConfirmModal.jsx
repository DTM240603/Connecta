function ConfirmModal({
    open,
    title = "Xác nhận",
    description = "Bạn có chắc muốn thực hiện hành động này không?",
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    onConfirm,
    onCancel,
    loading = false,
}) {
    if (!open) return null;

    return (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal-card">
                <div className="confirm-modal-header">
                    <h2>{title}</h2>
                    <button className="confirm-close-btn" onClick={onCancel}>
                        ✕
                    </button>
                </div>

                <div className="confirm-modal-body">
                    <p>{description}</p>
                </div>

                <div className="confirm-modal-footer">
                    <button className="confirm-cancel-btn" onClick={onCancel} disabled={loading}>
                        {cancelText}
                    </button>

                    <button className="confirm-submit-btn" onClick={onConfirm} disabled={loading}>
                        {loading ? "Đang xử lý..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;