"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { api } from "@/lib/api/api-client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const playspaceAuditDraftSchema = z.object({
  visitDate: z.string(),
  notes: z.string().max(10_000).optional(),
  playValueScore: z.number().min(0).max(100),
  usabilityScore: z.number().min(0).max(100),
});

type PlayspaceAuditDraft = z.infer<typeof playspaceAuditDraftSchema>;
type PlayspaceAuditDraftPatch = Partial<PlayspaceAuditDraft>;

interface PatchDraftInput {
  placeId: string;
  draft: PlayspaceAuditDraftPatch;
}

function safeNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const STEPS = [
  { id: "visit", title: "Visit" },
  { id: "play-value", title: "Play value" },
  { id: "usability", title: "Usability" },
] as const;

export interface AuditExecuteFormProps {
  placeId: string;
}

export function AuditExecuteForm({ placeId }: AuditExecuteFormProps) {
  const [stepIndex, setStepIndex] = React.useState<number>(0);
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const form = useForm<PlayspaceAuditDraft>({
    resolver: zodResolver(playspaceAuditDraftSchema),
    defaultValues: {
      visitDate: "",
      notes: "",
      playValueScore: 0,
      usabilityScore: 0,
    },
    mode: "onChange",
  });

  const values = useWatch({ control: form.control });
  const lastQueuedJsonRef = React.useRef<string | null>(null);

  const patchDraft = useMutation({
    mutationFn: async (input: PatchDraftInput) => {
      const response = await api.patch(
        `/playsafe/places/${encodeURIComponent(input.placeId)}/audits/draft`,
        input.draft,
      );
      return response.data;
    },
    onSuccess: () => {
      setLastSavedAt(new Date());
      setSaveError(null);
    },
    onError: (error) => {
      setLastSavedAt(null);
      setSaveError(error instanceof Error ? error.message : "Auto-save failed.");
    },
  });

  React.useEffect(() => {
    const parsed = playspaceAuditDraftSchema.partial().safeParse(values);
    if (!parsed.success) return;

    const json = JSON.stringify(parsed.data);
    if (json === lastQueuedJsonRef.current) return;

    lastQueuedJsonRef.current = json;
    setSaveError(null);

    const handle = window.setTimeout(() => {
      patchDraft.mutate({ placeId, draft: parsed.data });
    }, 900);

    return () => {
      window.clearTimeout(handle);
    };
  }, [placeId, patchDraft, values]);

  const step = STEPS[stepIndex];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Execute audit</h1>
          <p className="text-sm text-muted-foreground">
            Place: <span className="font-mono">{placeId}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {patchDraft.isPending ? (
            <Badge variant="secondary">Saving…</Badge>
          ) : lastSavedAt ? (
            <Badge variant="secondary">Saved {formatTime(lastSavedAt)}</Badge>
          ) : (
            <Badge variant="outline">Not saved yet</Badge>
          )}
          {saveError ? <Badge variant="destructive">{saveError}</Badge> : null}
          <Button asChild variant="secondary">
            <Link href="/auditor/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Step {stepIndex + 1}: {step.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {STEPS.map((s, idx) => (
              <Badge
                key={s.id}
                className={cn(
                  "cursor-default select-none",
                  idx === stepIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                {idx + 1}. {s.title}
              </Badge>
            ))}
          </div>

          <form className="space-y-6">
            {step.id === "visit" ? (
              <div className="grid gap-4 sm:max-w-xl">
                <div className="grid gap-2">
                  <Label htmlFor="visit_date">Visit date</Label>
                  <Input id="visit_date" type="date" {...form.register("visitDate")} />
                  {form.formState.errors.visitDate?.message ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.visitDate.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    rows={6}
                    placeholder="Optional notes about the visit..."
                    {...form.register("notes")}
                  />
                  {form.formState.errors.notes?.message ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.notes.message}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {step.id === "play-value" ? (
              <div className="grid gap-4 sm:max-w-xl">
                <div className="grid gap-2">
                  <Label htmlFor="play_value_score">Play value score (0–100)</Label>
                  <Input
                    id="play_value_score"
                    inputMode="numeric"
                    value={String(form.getValues("playValueScore"))}
                    onChange={(e) => {
                      const nextValue = safeNumber(e.target.value);
                      if (nextValue === null) return;
                      form.setValue("playValueScore", nextValue, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                  />
                  {form.formState.errors.playValueScore?.message ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.playValueScore.message}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {step.id === "usability" ? (
              <div className="grid gap-4 sm:max-w-xl">
                <div className="grid gap-2">
                  <Label htmlFor="usability_score">Usability score (0–100)</Label>
                  <Input
                    id="usability_score"
                    inputMode="numeric"
                    value={String(form.getValues("usabilityScore"))}
                    onChange={(e) => {
                      const nextValue = safeNumber(e.target.value);
                      if (nextValue === null) return;
                      form.setValue("usabilityScore", nextValue, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                  />
                  {form.formState.errors.usabilityScore?.message ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.usabilityScore.message}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStepIndex((idx) => Math.max(0, idx - 1))}
              disabled={stepIndex === 0}
            >
              Back
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  patchDraft.mutate({
                    placeId,
                    draft: playspaceAuditDraftSchema.partial().parse(form.getValues()),
                  });
                }}
                disabled={patchDraft.isPending}
              >
                Save now
              </Button>

              <Button
                type="button"
                onClick={async () => {
                  if (step.id === "visit") {
                    const value = form.getValues("visitDate");
                    if (value.trim().length === 0) {
                      form.setError("visitDate", {
                        type: "manual",
                        message: "Visit date is required.",
                      });
                      return;
                    }
                  }

                  const fieldsToValidate =
                    step.id === "play-value"
                      ? (["playValueScore"] as const)
                      : (["usabilityScore"] as const);

                  const isStepValid = await form.trigger(fieldsToValidate);
                  if (!isStepValid) return;

                  setStepIndex((idx) => Math.min(STEPS.length - 1, idx + 1));
                }}
                disabled={stepIndex === STEPS.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

