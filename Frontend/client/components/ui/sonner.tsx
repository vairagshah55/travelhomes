import type { ComponentProps } from "react";
import { useTheme } from "../../components/ThemeProvider";
import { Toaster as Sonner } from "sonner";

type ToasterProps = ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast motion-toast-surface group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:!left-[auto] group-[.toast]:!right-4 group-[.toast]:!top-1/2 group-[.toast]:!-translate-y-1/2 group-[.toast]:!bg-transparent group-[.toast]:!border-none group-[.toast]:text-foreground group-[.toast]:hover:text-foreground/80",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
