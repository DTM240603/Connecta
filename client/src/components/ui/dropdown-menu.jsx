import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { motion } from "motion/react";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

function DropdownMenu(props) {
  return <DropdownMenuPrimitive.Root {...props} />;
}

function DropdownMenuTrigger(props) {
  return <DropdownMenuPrimitive.Trigger {...props} />;
}

function DropdownMenuPortal(props) {
  return <DropdownMenuPrimitive.Portal {...props} />;
}

function DropdownMenuContent({ className, sideOffset = 8, ...props }) {
  return (
    <DropdownMenuPortal>
      <DropdownMenuPrimitive.Content asChild sideOffset={sideOffset}>
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={cn(
            "z-50 min-w-48 rounded-xl border border-line bg-white p-1.5 shadow-lg outline-none",
            className,
          )}
          {...props}
        />
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPortal>
  );
}

function DropdownMenuItem({ className, inset, ...props }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition hover:bg-orange-50 focus:bg-orange-50",
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className, ...props }) {
  return <DropdownMenuPrimitive.Separator className={cn("my-1 h-px bg-line", className)} {...props} />;
}

function DropdownMenuLabel({ className, inset, ...props }) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn("px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted", inset && "pl-8", className)}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({ className, children, checked, ...props }) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      checked={checked}
      className={cn("relative flex cursor-default select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm outline-none hover:bg-orange-50", className)}
      {...props}
    >
      <span className="absolute left-2 inline-flex h-4 w-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check size={14} />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuSubTrigger({ className, inset, children, ...props }) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      className={cn(
        "flex cursor-default select-none items-center rounded-lg px-3 py-2 text-sm outline-none hover:bg-orange-50 focus:bg-orange-50",
        inset && "pl-8",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto" size={16} />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuSubTrigger,
};
