import Link from "next/link";
import { ArrowLeft, CalendarHeart, Home, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/30 px-4 py-12">
      {/* Decorative background */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 size-[500px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <Card className="overflow-hidden border-border/60 shadow-sm">
          <CardContent className="p-8 text-center sm:p-10">
            {/* Icon */}

            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10">
              <SearchX className="size-8 text-primary" />
            </div>

            {/* 404 */}

            <p className="mt-8 text-7xl font-bold tracking-tighter text-foreground sm:text-8xl">
              404
            </p>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
              This page got lost somewhere.
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
              The page you&apos;re looking for doesn&apos;t exist, may have been
              moved, or the invitation link may no longer be valid.
            </p>

            {/* Actions */}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/">
                <Button size="lg">
                  <Home className="mr-2 size-4" />
                  Back to home
                </Button>
              </Link>

              {/* <Link href="javascript:history.back()">
                <Button variant="outline" size="lg">
                  <ArrowLeft className="mr-2 size-4" />
                  Go back
                </Button>
              </Link> */}
            </div>

            {/* Branding */}

            <div className="mt-10 flex items-center justify-center gap-2 border-t pt-6">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <CalendarHeart className="size-4 text-primary" />
              </div>

              <span className="text-sm font-medium">Wedding Check-In</span>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          If you followed an invitation link, make sure the link is complete and
          hasn&apos;t been revoked.
        </p>
      </div>
    </main>
  );
}
