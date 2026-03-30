import { cn } from "../../lib/utils";

function Avatar({ className, ...props }) {
  return (
    <div
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  );
}

function AvatarImage({ className, alt = "", ...props }) {
  return <img alt={alt} className={cn("h-full w-full object-cover", className)} {...props} />;
}

function AvatarFallback({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-orange-50 text-sm font-semibold text-primary",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
