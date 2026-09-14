import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Wedding Check-In</h1>

        <p className="mt-3 text-muted-foreground">
          Guest management and event check-in system
        </p>

        <Button className="mt-6">Get Started</Button>
      </div>
    </main>
  );
}
