import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type SiteCrumb = {
  label: string;
  to?: string;
};

export function SiteBreadcrumbs({ items }: { items: SiteCrumb[] }) {
  return (
    <Breadcrumb>
      <BreadcrumbList className="text-slate-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <BreadcrumbItem key={`${item.label}-${index}`}>
              {index > 0 && (
                <BreadcrumbSeparator className="text-slate-600">
                  <ChevronRight className="h-3.5 w-3.5" />
                </BreadcrumbSeparator>
              )}
              {isLast || !item.to ? (
                <BreadcrumbPage className="font-medium text-slate-200">{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild className="text-slate-400 hover:text-white">
                  <Link to={item.to as never}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
