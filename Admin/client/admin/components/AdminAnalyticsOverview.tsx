import React from "react";
import { useNavigate } from "react-router-dom";
import { analyticsService } from "@/services/api";

interface MetricCard {
  title: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
  iconBgColor: string;
  navigate?: string;
}

const AdminAnalyticsOverview = () => {
  const navigate = useNavigate();
  const [data, setData] = React.useState<any>(null);
  React.useEffect(() => {
    (async () => {
      try {
        const json = await analyticsService.getOverview();
        setData(json?.data || null);
      } catch (e) {
        console.error('Failed to load analytics overview', e);
      }
    })();
  }, []);
  // Custom icons matching Figma design
  const UserIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.99967 9.99984C12.3009 9.99984 14.1663 8.13436 14.1663 5.83317C14.1663 3.53198 12.3009 1.6665 9.99967 1.6665C7.69849 1.6665 5.83301 3.53198 5.83301 5.83317C5.83301 8.13436 7.69849 9.99984 9.99967 9.99984Z"
        stroke="#131313"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.1585 18.3333C17.1585 15.1083 13.9501 12.5 10.0001 12.5C6.05013 12.5 2.8418 15.1083 2.8418 18.3333"
        stroke="#131313"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const ClickIcon = () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.9998 14.9998L12.9998 19.9998L8.99983 8.99976L19.9998 12.9998L14.9998 14.9998ZM14.9998 14.9998L19.9998 19.9998M7.18806 2.23828L7.96452 5.13606M5.13606 7.96448L2.23828 7.18802M13.9495 4.05005L11.8282 6.17137M6.17146 11.8281L4.05014 13.9494"
        stroke="#111827"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const ClipboardIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.75879 12.2498L9.00879 13.4998L12.3421 10.1665"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.33366 4.99984H11.667C13.3337 4.99984 13.3337 4.1665 13.3337 3.33317C13.3337 1.6665 12.5003 1.6665 11.667 1.6665H8.33366C7.50033 1.6665 6.66699 1.6665 6.66699 3.33317C6.66699 4.99984 7.50033 4.99984 8.33366 4.99984Z"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.3333 3.3501C16.1083 3.5001 17.5 4.5251 17.5 8.33343V13.3334C17.5 16.6668 16.6667 18.3334 12.5 18.3334H7.5C3.33333 18.3334 2.5 16.6668 2.5 13.3334V8.33343C2.5 4.53343 3.89167 3.5001 6.66667 3.3501"
        stroke="#292D32"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const WalletIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.033 11.2918C14.683 11.6335 14.483 12.1252 14.533 12.6502C14.608 13.5502 15.433 14.2085 16.333 14.2085H17.9163V15.2002C17.9163 16.9252 16.508 18.3335 14.783 18.3335H5.21634C3.49134 18.3335 2.08301 16.9252 2.08301 15.2002V9.59184C2.08301 7.86684 3.49134 6.4585 5.21634 6.4585H14.783C16.508 6.4585 17.9163 7.86684 17.9163 9.59184V10.7918H16.233C15.7663 10.7918 15.3413 10.9752 15.033 11.2918Z"
        stroke="#131313"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.08301 10.3416V6.5333C2.08301 5.54163 2.69134 4.65826 3.61634 4.30826L10.233 1.80826C11.2663 1.41659 12.3747 2.18329 12.3747 3.29162V6.45828"
        stroke="#131313"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.7987 11.642V13.3587C18.7987 13.817 18.432 14.192 17.9653 14.2086H16.332C15.432 14.2086 14.607 13.5503 14.532 12.6503C14.482 12.1253 14.682 11.6336 15.032 11.292C15.3404 10.9753 15.7653 10.792 16.232 10.792H17.9653C18.432 10.8087 18.7987 11.1836 18.7987 11.642Z"
        stroke="#131313"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.83301 10H11.6663"
        stroke="#131313"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const TaskIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.16699 16.25H17.5003"
        stroke="#131313"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.16699 10.4165H17.5003"
        stroke="#131313"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.16699 4.5835H17.5003"
        stroke="#131313"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.5 4.58317L3.33333 5.4165L5.83333 2.9165"
        stroke="#131313"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.5 10.4167L3.33333 11.25L5.83333 8.75"
        stroke="#131313"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.5 16.2502L3.33333 17.0835L5.83333 14.5835"
        stroke="#131313"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const defaultServiceData = [
    {
      title: "Camper Van",
      firstRow: [
        {
          title: "Total Impression",
          value: "0",
          icon: <UserIcon />,
          bgColor: "bg-orange-50",
          iconBgColor: "bg-orange-100",
        },
        {
          title: "Total Clicks",
          value: "0",
          icon: <ClickIcon />,
          bgColor: "bg-purple-50",
          iconBgColor: "bg-purple-100",
        },
        {
          title: "Total Properties",
          value: "0",
          icon: <ClipboardIcon />,
          bgColor: "bg-cyan-50",
          iconBgColor: "bg-cyan-100",
        },
        {
          title: "Active Properties",
          value: "0",
          icon: <WalletIcon />,
          bgColor: "bg-purple-50",
          iconBgColor: "bg-purple-100",
        },
      ],
      secondRow: [
        {
          title: "Inactive Properties",
          value: "0",
          icon: <WalletIcon />,
          bgColor: "bg-purple-50",
          iconBgColor: "bg-purple-100",
        },
        {
          title: "Total days of Booking",
          value: "0",
          icon: <ClickIcon />,
          bgColor: "bg-purple-50",
          iconBgColor: "bg-purple-100",
        },
        {
          title: "Total Revenue",
          value: "0",
          icon: <TaskIcon />,
          bgColor: "bg-green-50",
          iconBgColor: "bg-green-100",
        },
      ],
    },
    // Repeat structure for others if needed for initial render, 
    // or just rely on the map logic below.
  ];

  const mapStats = (cat: string, title: string) => {
    const stats = data ? data[cat] : null;
    return {
      title,
      firstRow: [
        {
          title: "Total Impression",
          value: stats?.impressions?.toString() || "0",
          icon: <UserIcon />,
          bgColor: "bg-orange-50",
          iconBgColor: "bg-orange-100",
        },
        {
          title: "Total Clicks",
          value: stats?.clicks?.toString() || "0",
          icon: <ClickIcon />,
          bgColor: "bg-purple-50",
          iconBgColor: "bg-purple-100",
        },
        {
          title: "Total Properties",
          value: stats?.totalProperties?.toString() || "0",
          icon: <ClipboardIcon />,
          bgColor: "bg-cyan-50",
          iconBgColor: "bg-cyan-100",
          navigate: "/admin/management/listing",
        },
        {
          title: "Active Properties",
          value: stats?.activeProperties?.toString() || "0",
          icon: <WalletIcon />,
          bgColor: "bg-purple-50",
          iconBgColor: "bg-purple-100",
          navigate: "/admin/management/listing",
        },
      ],
      secondRow: [
        {
          title: "Inactive Properties",
          value: stats?.inactiveProperties?.toString() || "0",
          icon: <WalletIcon />,
          bgColor: "bg-purple-50",
          iconBgColor: "bg-purple-100",
          navigate: "/admin/management/listing",
        },
        {
          title: "Total days of Booking",
          value: stats?.totalBookings?.toString() || "0",
          icon: <ClickIcon />,
          bgColor: "bg-purple-50",
          iconBgColor: "bg-purple-100",
          navigate: "/admin/management/booking",
        },
        {
          title: "Total Revenue",
          value: stats?.totalRevenue?.toString() || "0",
          icon: <TaskIcon />,
          bgColor: "bg-green-50",
          iconBgColor: "bg-green-100",
          navigate: "/admin/payments",
        },
      ],
    };
  };

  const serviceData = [
    mapStats('camper-van', 'Camper Van'),
    mapStats('unique-stay', 'Unique Stay'),
    mapStats('activity', 'Activity')
  ];

  const MetricCardComponent = ({ metric }: { metric: MetricCard }) => (
    <div
      onClick={() => metric.navigate && navigate(metric.navigate)}
      className={`p-4 rounded-xl ${metric.bgColor} hover:shadow-md transition-all cursor-pointer group flex-1 min-w-[250px]`}
    >
      <div className="flex items-start gap-5">
        <div
          className={`w-12 h-12 rounded-full ${metric.iconBgColor} flex items-center justify-center group-hover:scale-110 transition-transform mt-1 flex-shrink-0`}
        >
          {metric.icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-plus-jakarta mb-2">
            {metric.title}
          </p>
          <p className="text-2xl font-bold text-black font-geist">
            {metric.value}
          </p>
        </div>
      </div>
    </div>
  );

  const ServiceSection = ({
    service,
  }: {
    service: (typeof serviceData)[0];
  }) => (
    <div className="space-y-3">
      <h3 className="text-xl font-bold text-black font-geist">
        {service.title}
      </h3>

      {/* First Row */}
      <div className="grid grid-cols-4 gap-3">
        {service.firstRow.map((metric, index) => (
          <MetricCardComponent key={index} metric={metric} />
        ))}
      </div>

      {/* Second Row */}
 <div className="grid grid-cols-4 gap-3">
        {service.secondRow.map((metric, index) => (
          <MetricCardComponent key={index} metric={metric} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-5">
      <div className="max-w-none overflow-x-hidden  max-xl:flex-wrap space-y-6">
        {serviceData.map((service, index) => (
          <ServiceSection key={index} service={service} />
        ))}
      </div>
    </div>
  );
};

export default AdminAnalyticsOverview;
