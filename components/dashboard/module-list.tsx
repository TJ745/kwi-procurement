import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { NavItem } from "@/lib/navigation";

type ModuleListProps = {
  title: string;
  description: string;
  items: NavItem[];
  badge?: string;
};

export function ModuleList({ title, description, items, badge }: ModuleListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="-mx-2 flex flex-col">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex items-center gap-3 rounded-lg px-2 py-2.5 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                  <item.icon className="size-4" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </div>
                {badge && <Badge variant="secondary">{badge}</Badge>}
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
