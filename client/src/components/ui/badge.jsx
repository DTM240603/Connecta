import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-orange-200 bg-orange-50 text-primary",
        secondary: "border-stone-200 bg-stone-100 text-muted",
        success: "border-emerald-200 bg-emerald-50 text-emerald-700",
        danger: "border-red-200 bg-red-50 text-red-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
