import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

function ConfirmModal({
  open,
  title = "Xac nhan",
  description = "Ban co chac muon thuc hien hanh dong nay khong?",
  confirmText = "Xac nhan",
  cancelText = "Huy",
  onConfirm,
  onCancel,
  loading = false,
}) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onCancel?.()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Dang xu ly..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmModal;
