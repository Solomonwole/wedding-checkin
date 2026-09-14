"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { guestSchema, GuestFormValues } from "@/lib/validations/guest";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

import { Switch } from "@/components/ui/switch";

import { Textarea } from "@/components/ui/textarea";

export function AddGuestDialog() {
  const [open, setOpen] = useState(false);

  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      category: "",
      plusOne: false,
      notes: "",
    },
  });

  const onSubmit = async (values: GuestFormValues) => {
    console.log("Guest submitted:", values);

    await new Promise((resolve) => setTimeout(resolve, 700));

    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus />
            Add guest
          </Button>
        }
      />

      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add guest</DialogTitle>

          <DialogDescription>
            Add a guest to your wedding invitation list.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* First name */}
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

              {/* Last name */}
              <Field>
                <FieldLabel htmlFor="lastName">Last name</FieldLabel>

                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...form.register("lastName")}
                />

                {form.formState.errors.lastName && (
                  <FieldError>
                    {form.formState.errors.lastName.message}
                  </FieldError>
                )}
              </Field>
            </div>

            {/* Email */}
            <Field>
              <FieldLabel htmlFor="email">Email address</FieldLabel>

              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...form.register("email")}
              />

              {form.formState.errors.email && (
                <FieldError>{form.formState.errors.email.message}</FieldError>
              )}
            </Field>

            {/* Phone */}
            <Field>
              <FieldLabel htmlFor="phone">Phone number</FieldLabel>

              <Input
                id="phone"
                type="tel"
                placeholder="+1 416 555 0101"
                {...form.register("phone")}
              />

              {form.formState.errors.phone && (
                <FieldError>{form.formState.errors.phone.message}</FieldError>
              )}
            </Field>

            {/* Category */}
            <Field>
              <FieldLabel>Guest category</FieldLabel>

              <Select
                value={form.watch("category")}
                onValueChange={(value) => {
                  if (value !== null) {
                    form.setValue("category", value, {
                      shouldValidate: true,
                    });
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Bride's Family">
                    Bride&apos;s Family
                  </SelectItem>

                  <SelectItem value="Groom's Family">
                    Groom&apos;s Family
                  </SelectItem>

                  <SelectItem value="Friends">Friends</SelectItem>

                  <SelectItem value="Colleagues">Colleagues</SelectItem>

                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>

              {form.formState.errors.category && (
                <FieldError>
                  {form.formState.errors.category.message}
                </FieldError>
              )}
            </Field>

            {/* Plus one */}
            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <FieldLabel>Allow plus one</FieldLabel>

                  <FieldDescription>
                    This guest can bring another person.
                  </FieldDescription>
                </div>

                <Switch
                  checked={form.watch("plusOne")}
                  onCheckedChange={(checked) =>
                    form.setValue("plusOne", checked)
                  }
                />
              </div>
            </div>

            {/* Notes */}
            <Field>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>

              <Textarea
                id="notes"
                placeholder="Optional notes about this guest..."
                rows={3}
                {...form.register("notes")}
              />

              <FieldDescription>
                Optional. Maximum 500 characters.
              </FieldDescription>

              {form.formState.errors.notes && (
                <FieldError>{form.formState.errors.notes.message}</FieldError>
              )}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Adding guest...
                </>
              ) : (
                <>
                  <Plus />
                  Add guest
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
