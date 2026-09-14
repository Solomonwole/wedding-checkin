"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, UserPlus } from "lucide-react";

import { guestSchema, type GuestFormValues } from "@/lib/validations/guest";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Checkbox } from "@/components/ui/checkbox";

import { Textarea } from "@/components/ui/textarea";

interface NewGuestPageProps {
  params: Promise<{
    organizationSlug: string;
    eventId: string;
  }>;
}

const categories = [
  "Guest",
  "VIP",
  "Family",
  "Bridal Party",
  "Groom's Party",
  "Vendor",
  "Staff",
];

export default function NewGuestPage({ params }: NewGuestPageProps) {
  const { organizationSlug, eventId } = use(params);

  const router = useRouter();

  const [serverError, setServerError] = useState("");

  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      category: "Guest",
      plusOne: false,
      notes: "",
    },
  });

  async function onSubmit(values: GuestFormValues) {
    setServerError("");

    try {
      const response = await fetch(`/api/events/${eventId}/guests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        setServerError(result.error || "Unable to add guest.");
        return;
      }

      router.push(`/org/${organizationSlug}/events/${eventId}/guests`);

      router.refresh();
    } catch {
      setServerError("Unable to connect to the server.");
    }
  }

  const guestsPath = `/org/${organizationSlug}/events/${eventId}/guests`;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2"
          onClick={() => router.push(guestsPath)}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to guests
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <UserPlus className="size-5 text-primary" />
              </div>

              <div>
                <CardTitle>Add guest</CardTitle>

                <CardDescription>
                  Add someone to your event guest list.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FieldGroup>
                {/* Name */}

                <div className="grid gap-6 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="firstName">First name</FieldLabel>

                    <Input
                      id="firstName"
                      placeholder="John"
                      {...form.register("firstName")}
                    />

                    {form.formState.errors.firstName && (
                      <FieldError>
                        {form.formState.errors.firstName.message}
                      </FieldError>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="lastName">Last name</FieldLabel>

                    <Input
                      id="lastName"
                      placeholder="Smith"
                      {...form.register("lastName")}
                    />

                    {form.formState.errors.lastName && (
                      <FieldError>
                        {form.formState.errors.lastName.message}
                      </FieldError>
                    )}
                  </Field>
                </div>

                {/* Contact */}

                <div className="grid gap-6 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>

                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      {...form.register("email")}
                    />

                    {form.formState.errors.email && (
                      <FieldError>
                        {form.formState.errors.email.message}
                      </FieldError>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="phone">Phone</FieldLabel>

                    <Input
                      id="phone"
                      placeholder="+1 416 555 0123"
                      {...form.register("phone")}
                    />

                    {form.formState.errors.phone && (
                      <FieldError>
                        {form.formState.errors.phone.message}
                      </FieldError>
                    )}
                  </Field>
                </div>

                {/* Category */}

                <Field>
                  <FieldLabel>Category</FieldLabel>

                  <Select
                    value={form.watch("category")}
                    onValueChange={(value) => {
                      if (value !== null) {
                        form.setValue("category", value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>

                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FieldDescription>
                    Use categories to organize your guest list.
                  </FieldDescription>

                  {form.formState.errors.category && (
                    <FieldError>
                      {form.formState.errors.category.message}
                    </FieldError>
                  )}
                </Field>

                {/* Plus one */}

                <Field
                  orientation="horizontal"
                  className="rounded-xl border p-4"
                >
                  <Checkbox
                    id="plusOne"
                    checked={form.watch("plusOne")}
                    onCheckedChange={(checked) => {
                      form.setValue("plusOne", checked === true, {
                        shouldDirty: true,
                      });
                    }}
                  />

                  <div>
                    <FieldLabel htmlFor="plusOne">
                      Guest has a plus one
                    </FieldLabel>

                    <FieldDescription>
                      Allow this guest to bring one additional person.
                    </FieldDescription>
                  </div>
                </Field>

                {/* Notes */}

                <Field>
                  <FieldLabel htmlFor="notes">Notes</FieldLabel>

                  <Textarea
                    id="notes"
                    placeholder="Optional notes about this guest..."
                    className="min-h-24 resize-none"
                    {...form.register("notes")}
                  />

                  <FieldDescription>
                    Optional notes for your event team.
                  </FieldDescription>

                  {form.formState.errors.notes && (
                    <FieldError>
                      {form.formState.errors.notes.message}
                    </FieldError>
                  )}
                </Field>
              </FieldGroup>

              {serverError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {serverError}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(guestsPath)}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? "Adding guest..."
                    : "Add guest"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
