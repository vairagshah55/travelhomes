import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-1.5 text-xs mb-1">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={12} className="text-gray-300 shrink-0" />}
            {isLast ? (
              <span className="text-gray-700 font-medium">{item.label}</span>
            ) : item.href ? (
              <button
                onClick={() => navigate(item.href!)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-gray-400">{item.label}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export default Breadcrumb;
