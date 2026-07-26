import React from "react";
import { Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "./ThemeProvider";

/**
 * Vendor header theme switch. Sized and coloured to match the other 44px
 * circular controls in the vendor/admin top bar (notification bell, avatar).
 * Uses a plain <button> rather than the shadcn Button so `size="icon"`'s
 * h-10/w-10 can't win over size-11 depending on stylesheet order.
 */
export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative grid place-items-center size-11 rounded-full border border-[#eceff3] dark:border-gray-700 bg-[#f3f4f6] dark:bg-gray-800 hover:bg-[#eef0f3] dark:hover:bg-gray-700 text-[#475467] dark:text-gray-300 hover:text-[#101828] dark:hover:text-white transition-colors motion-theme-toggle"
        >
          <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all motion-theme-icon dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all motion-theme-icon dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="min-w-[160px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-1.5"
      >
        <DropdownMenuItem
          className="px-2.5 py-2 text-[13.5px] font-medium cursor-pointer text-gray-700 dark:text-gray-200 focus:bg-gray-100 dark:focus:bg-gray-700/60 focus:text-gray-900 dark:focus:text-white rounded-lg"
          onSelect={() => setTheme("light")}
        >
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          className="px-2.5 py-2 text-[13.5px] font-medium cursor-pointer text-gray-700 dark:text-gray-200 focus:bg-gray-100 dark:focus:bg-gray-700/60 focus:text-gray-900 dark:focus:text-white rounded-lg"
          onSelect={() => setTheme("dark")}
        >
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          className="px-2.5 py-2 text-[13.5px] font-medium cursor-pointer text-gray-700 dark:text-gray-200 focus:bg-gray-100 dark:focus:bg-gray-700/60 focus:text-gray-900 dark:focus:text-white rounded-lg"
          onSelect={() => setTheme("system")}
        >
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
