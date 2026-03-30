import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../lib/utils";

function Tabs({ className, ...props }) {
  return <TabsPrimitive.Root className={cn("w-full", className)} {...props} />;
}

function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn("inline-flex rounded-xl border border-orange-100 bg-orange-50 p-1", className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-muted outline-none transition data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-4 outline-none data-[state=inactive]:hidden", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
