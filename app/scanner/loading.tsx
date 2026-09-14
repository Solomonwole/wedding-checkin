import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="flex flex-col items-center text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
          <Loader2 className="size-7 animate-spin text-primary" />
        </div>

        <h2 className="mt-4 text-lg font-semibold">Loading scanner</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Checking this device...
        </p>
      </div>
    </div>
  );
}
