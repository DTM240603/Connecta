import { cn } from "../../lib/utils";

function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full rounded-2xl border border-line bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted focus:border-orange-200 focus:ring-4 focus:ring-orange-100",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
