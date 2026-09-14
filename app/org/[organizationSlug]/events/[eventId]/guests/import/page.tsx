"use client";

import { use } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";

import {
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  Users,
  X,
} from "lucide-react";

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
  FieldLabel,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ImportPageProps {
  params: Promise<{
    organizationSlug: string;
    eventId: string;
  }>;
}

interface ImportGuest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  category: string;
  plusOne: boolean;
  notes: string;
}

interface ParsedRow {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  category: string;
  plusOne: boolean;
  notes: string;
}

function normalizeHeader(header: string) {
  return header
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "");
}

function getValue(row: Record<string, string>, names: string[]) {
  const normalizedNames = names.map(normalizeHeader);

  const key = Object.keys(row).find((key) =>
    normalizedNames.includes(normalizeHeader(key)),
  );

  return key ? String(row[key] ?? "").trim() : "";
}

function parseBoolean(value: string) {
  return ["true", "yes", "y", "1"].includes(value.toLowerCase());
}

export default function ImportGuestsPage({ params }: ImportPageProps) {
  const { organizationSlug, eventId } = use(params);

  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);

  const [preview, setPreview] = useState<ParsedRow[]>([]);

  const [error, setError] = useState("");

  const [importing, setImporting] = useState(false);

  const [success, setSuccess] = useState(false);

  const guestsPath = `/org/${organizationSlug}/events/${eventId}/guests`;

  function handleFile(selectedFile: File | null) {
    setError("");
    setPreview([]);
    setSuccess(false);

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a CSV file.");
      return;
    }

    setFile(selectedFile);

    Papa.parse<Record<string, string>>(selectedFile, {
      header: true,
      skipEmptyLines: true,

      complete: (results) => {
        if (results.errors.length > 0) {
          setError("There was a problem reading this CSV file.");
          return;
        }

        const rows = results.data.map((row) => ({
          firstName: getValue(row, ["first name", "firstname", "first_name"]),

          lastName: getValue(row, ["last name", "lastname", "last_name"]),

          email: getValue(row, ["email", "email address", "email_address"]),

          phone: getValue(row, [
            "phone",
            "phone number",
            "phone_number",
            "mobile",
          ]),

          category:
            getValue(row, ["category", "type", "guest type"]) || "Guest",

          plusOne: parseBoolean(
            getValue(row, ["plus one", "plusone", "plus_one"]),
          ),

          notes: getValue(row, ["notes", "note"]),
        }));

        const invalidRows = rows.filter(
          (row) => !row.firstName || !row.lastName,
        );

        if (invalidRows.length > 0) {
          setError(
            `${invalidRows.length} guest${
              invalidRows.length === 1 ? "" : "s"
            } missing first or last name.`,
          );
        }

        setPreview(rows);
      },
    });
  }

  function clearFile() {
    setFile(null);
    setPreview([]);
    setError("");
  }

  async function handleImport() {
    if (!preview.length) {
      return;
    }

    setImporting(true);
    setError("");

    try {
      const response = await fetch(`/api/events/${eventId}/guests/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guests: preview,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Unable to import guests.");
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        router.push(guestsPath);
        router.refresh();
      }, 1000);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2"
          onClick={() => router.push(guestsPath)}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to guests
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Import guests
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Upload your existing guest list from a CSV file.
          </p>
        </div>

        {/* Upload */}

        {!file && (
          <Card>
            <CardHeader>
              <CardTitle>Upload guest list</CardTitle>

              <CardDescription>
                Your CSV should contain at least a first name and last name.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <label
                htmlFor="csv-upload"
                className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center transition-colors hover:bg-muted/50"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <FileSpreadsheet className="size-5 text-muted-foreground" />
                </div>

                <p className="mt-4 font-medium">Choose a CSV file</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Click to browse from your computer
                </p>

                <div className="mt-5">
                  <Button type="button" variant="outline">
                    <Upload className="mr-2 size-4" />
                    Select CSV
                  </Button>
                </div>

                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(event) =>
                    handleFile(event.target.files?.[0] ?? null)
                  }
                />
              </label>

              <div className="mt-6 rounded-lg bg-muted/50 p-4 text-sm">
                <p className="font-medium">Supported columns</p>

                <p className="mt-1 text-muted-foreground">
                  First Name, Last Name, Email, Phone, Category, Plus One, Notes
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview */}

        {file && (
          <div className="space-y-6">
            <Card>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <FileSpreadsheet className="size-5" />
                  </div>

                  <div>
                    <p className="font-medium">{file.name}</p>

                    <p className="text-sm text-muted-foreground">
                      {preview.length} guests found
                    </p>
                  </div>
                </div>

                <Button variant="ghost" size="sm" onClick={clearFile}>
                  <X className="mr-2 size-4" />
                  Remove
                </Button>
              </CardContent>
            </Card>

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {success ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckCircle2 className="size-12 text-primary" />

                  <h2 className="mt-4 text-lg font-semibold">
                    Guests imported
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Your guest list has been updated.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Preview</CardTitle>

                        <CardDescription>
                          Review the guests before importing them.
                        </CardDescription>
                      </div>

                      <Badge variant="secondary">
                        <Users className="mr-1 size-3" />
                        {preview.length}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-y bg-muted/40">
                            <th className="px-5 py-3 text-left font-medium">
                              Name
                            </th>

                            <th className="px-5 py-3 text-left font-medium">
                              Email
                            </th>

                            <th className="px-5 py-3 text-left font-medium">
                              Category
                            </th>

                            <th className="px-5 py-3 text-left font-medium">
                              Plus one
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {preview.slice(0, 50).map((guest, index) => (
                            <tr
                              key={`${guest.firstName}-${guest.lastName}-${index}`}
                              className="border-b last:border-0"
                            >
                              <td className="px-5 py-3 font-medium">
                                {guest.firstName} {guest.lastName}
                              </td>

                              <td className="px-5 py-3 text-muted-foreground">
                                {guest.email || "—"}
                              </td>

                              <td className="px-5 py-3">
                                <Badge variant="outline">
                                  {guest.category}
                                </Badge>
                              </td>

                              <td className="px-5 py-3">
                                {guest.plusOne ? "Yes" : "No"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {preview.length > 50 && (
                      <div className="border-t px-5 py-3 text-center text-sm text-muted-foreground">
                        Showing first 50 of {preview.length} guests.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push(guestsPath)}
                  >
                    Cancel
                  </Button>

                  <Button
                    disabled={importing || preview.length === 0}
                    onClick={handleImport}
                  >
                    {importing
                      ? "Importing..."
                      : `Import ${preview.length} guests`}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
