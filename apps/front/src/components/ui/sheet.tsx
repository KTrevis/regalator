import type { ComponentProps } from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;

export const SheetPortal = SheetPrimitive.Portal;

export const SheetOverlay = ({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Overlay>) => (
  <SheetPrimitive.Overlay
    data-slot="sheet-overlay"
    className={cn(
      "fixed inset-0 z-50 bg-transparent data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
);

export const SheetContent = ({
  className,
  children,
  ...props
}: ComponentProps<typeof SheetPrimitive.Content>) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      data-slot="sheet-content"
      className={cn(
        "fixed inset-y-0 right-0 z-50 flex h-full w-80 flex-col border-l border-border bg-background text-foreground shadow-xl outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:w-96",
        className,
      )}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring">
        <XIcon className="size-4" />
        <span className="sr-only">Fermer</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
);

export const SheetHeader = ({
  className,
  ...props
}: ComponentProps<"div">) => (
  <div
    data-slot="sheet-header"
    className={cn("flex flex-col gap-1.5 p-6", className)}
    {...props}
  />
);

export const SheetTitle = ({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Title>) => (
  <SheetPrimitive.Title
    data-slot="sheet-title"
    className={cn("font-semibold text-foreground", className)}
    {...props}
  />
);

export const SheetDescription = ({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Description>) => (
  <SheetPrimitive.Description
    data-slot="sheet-description"
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
);
