import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

function Dialog(props) {
  return <DialogPrimitive.Root {...props} />;
}

function DialogTrigger(props) {
  return <DialogPrimitive.Trigger {...props} />;
}

function DialogPortal(props) {
  return <DialogPrimitive.Portal {...props} />;
}

function DialogClose(props) {
  return <DialogPrimitive.Close {...props} />;
}

function DialogOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Overlay asChild>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn("fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[2px]", className)}
        {...props}
      />
    </DialogPrimitive.Overlay>
  );
}

function DialogContent({ className, children, ...props }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content asChild>
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.98 }}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-white p-6 shadow-xl",
            className,
          )}
          {...props}
        >
          {children}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-2 text-muted transition hover:bg-orange-50 hover:text-primary">
            <X size={18} />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }) {
  return <div className={cn("mb-4 flex flex-col gap-1.5", className)} {...props} />;
}

function DialogTitle({ className, ...props }) {
  return <DialogPrimitive.Title className={cn("text-lg font-semibold", className)} {...props} />;
}

function DialogDescription({ className, ...props }) {
  return <DialogPrimitive.Description className={cn("text-sm text-muted", className)} {...props} />;
}

function DialogFooter({ className, ...props }) {
  return <div className={cn("mt-6 flex items-center justify-end gap-3", className)} {...props} />;
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
