"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewEventPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/events", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name,
          eventDate,
          venue,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Unable to create event.");

        setLoading(false);
        return;
      }

      // const createdEvent = result.event;

      // router.push(
      //   `/org/${createdEvent.organization_id}/events/${createdEvent.id}`,
      // );
      router.push(`/`);

      router.refresh();
    } catch {
      setError("Unable to connect to the server.");

      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Create your event
        </h1>

        <p className="mt-2 text-muted-foreground">
          Add the details for your wedding or event.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Event name</Label>

          <Input
            id="name"
            placeholder="John & Jane's Wedding"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="eventDate">Event date</Label>

          <Input
            id="eventDate"
            type="date"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="venue">Venue</Label>

          <Input
            id="venue"
            placeholder="The Grand Ballroom"
            value={venue}
            onChange={(event) => setVenue(event.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating event..." : "Create event"}
          </Button>
        </div>
      </form>
    </main>
  );
}
