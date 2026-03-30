import { cn } from "../../lib/utils";

function Input({ className, type = "text", ...props }) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted focus:border-orange-200 focus:ring-4 focus:ring-orange-100",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
