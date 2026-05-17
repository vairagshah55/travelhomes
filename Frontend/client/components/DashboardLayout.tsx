import { Sidebar } from "@/components/Navigation";
import { DashboardHeader } from "@/components/Header";
import MobileVendorNav from "@/components/MobileVendorNav";

interface DashboardLayoutProps {
  title: string;
  children: React.ReactNode;
  outerClassName?: string;
  contentClassName?: string;
}

const DashboardLayout = ({
  title,
  children,
  outerClassName = "",
  contentClassName = "flex-1 overflow-y-auto scrollbar-hide",
}: DashboardLayoutProps) => (
  <div
    className={`flex h-screen bg-dashboard-bg dark:bg-gray-900 font-plus-jakarta ${outerClassName}`}
  >
    <div className="hidden lg:block">
      <Sidebar />
    </div>

    <div className="flex-1 flex flex-col overflow-hidden">
      <DashboardHeader Headtitle={title} />
      <div className={contentClassName}>{children}</div>
    </div>

    <div className="lg:hidden fixed bottom-0 w-full z-50">
      <MobileVendorNav />
    </div>
  </div>
);

export default DashboardLayout;
