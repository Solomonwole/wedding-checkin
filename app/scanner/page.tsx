import { QrScanner } from "@/components/scanner/qr-scanner";

export default function ScannerPage() {
  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Wedding Checkin
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Guest Check-in
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Scan each guest&apos;s invitation to verify and check them in.
          </p>
        </div>

        <QrScanner />
      </div>
    </main>
  );
}
