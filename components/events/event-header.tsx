import Link from "next/link";
import { ChevronRight, MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface EventHeaderProps {
  organizationName: string;
  organizationSlug: string;
  eventName: string;
  eventStatus: string;
}

export function EventHeader({
  organizationName,
  organizationSlug,
  eventName,
  eventStatus,
}: EventHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={`/org/${organizationSlug}`}
            className="hidden truncate text-sm text-muted-foreground hover:text-foreground sm:block"
          >
            {organizationName}
          </Link>

          <ChevronRight className="hidden size-4 text-muted-foreground sm:block" />

          <span className="truncate text-sm font-medium">{eventName}</span>

          <Badge
            variant="secondary"
            className="ml-2 hidden capitalize sm:inline-flex"
          >
            {eventStatus}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreHorizontal className="size-4" />
          </Button>

          <Avatar className="size-8">
            <AvatarFallback>WC</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
