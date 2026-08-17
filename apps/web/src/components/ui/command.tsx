import * as React from "react";
import { type DialogProps } from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className,
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

interface CommandDialogProps extends DialogProps {
  /**
   * CSS custom properties for the portalled surface. The dialog renders under
   * `<body>`, outside whatever route root defines the theme, so token-based
   * classes inside it resolve against `:root` unless the caller passes its own
   * vars down. The admin palette passes `PORTAL_VARS`.
   */
  contentStyle?: React.CSSProperties;
  /**
   * Marks the surface as belonging to the vendor console, which theme-scopes it
   * via the `[data-console-portal]` blocks in global.css. `contentStyle` alone
   * can't do this: the neutral ramp differs between light and dark, and a style
   * object has no way to say "these greys, unless dark".
   */
  contentScope?: "admin" | "vendor";
}

const CommandDialog = ({ children, contentStyle, contentScope, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      {/* gap-0 neutralizes DialogContent's default gap-4 between children.
          The [&>button]:hidden hides the built-in DialogPrimitive.Close X
          button — cmdk users dismiss via overlay click, ESC, or selection.
          Styling is spelled in the `app-*` namespace rather than `tpl-*`,
          because only the former is carried in by `contentStyle`. */}
      <DialogContent
        style={contentStyle}
        data-console-portal={contentScope === "vendor" ? "" : undefined}
        className="overflow-hidden p-0 gap-0 rounded-2xl border-app-border bg-app-surface max-w-[640px] [&>button]:hidden"
      >
        <Command className="bg-app-surface text-app-fg [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-app-fg-subtle [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-group]]:py-1 [&_[cmdk-input-wrapper]_svg]:h-[18px] [&_[cmdk-input-wrapper]_svg]:w-[18px] [&_[cmdk-input]]:h-12 [&_[cmdk-input]]:text-[14px] [&_[cmdk-item]]:gap-3 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]]:rounded-lg [&_[cmdk-item]_svg]:h-[18px] [&_[cmdk-item]_svg]:w-[18px] [&_[cmdk-item]_svg]:shrink-0">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
};

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center gap-3 border-b border-app-border px-4" cmdk-input-wrapper="">
    <Search className="h-[18px] w-[18px] shrink-0 text-app-fg-subtle" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-12 w-full bg-transparent text-[14px] text-app-fg outline-none placeholder:text-app-fg-subtle disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  </div>
));

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[380px] overflow-y-auto overflow-x-hidden py-2", className)}
    {...props}
  />
));

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty ref={ref} className="py-6 text-center text-sm" {...props} />
));

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className,
    )}
    {...props}
  />
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      // The highlight is spelled in `app-accent` rather than shadcn's own
      // `bg-accent`: that token is declared twice app-wide in incompatible
      // formats, so it drops out and leaves the selected row unpainted.
      "relative flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-[14px] text-app-fg outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-app-accent-soft data-[selected=true]:text-app-accent data-[disabled=true]:opacity-50",
      className,
    )}
    {...props}
  />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  );
};
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
