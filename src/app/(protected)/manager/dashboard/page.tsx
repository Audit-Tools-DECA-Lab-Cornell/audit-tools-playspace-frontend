"use client";

import { useMutation } from "@tanstack/react-query";
import * as React from "react";

import { api } from "@/lib/api/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ManagerSurveyLinkResponse {
  survey_link: string;
}

interface RecentAuditRow {
  id: string;
  placeName: string;
  completedAtIso: string;
  audit_score: number;
  combined_score: number | null;
}

const DEMO_RECENT_AUDITS: RecentAuditRow[] = [
  {
    id: "audit_001",
    placeName: "Riverside Park",
    completedAtIso: "2026-03-04T21:15:00Z",
    audit_score: 82,
    combined_score: 88,
  },
  {
    id: "audit_002",
    placeName: "Maple Street Playground",
    completedAtIso: "2026-03-03T16:40:00Z",
    audit_score: 74,
    combined_score: null,
  },
];

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

export default function ManagerDashboardPage() {
  const [placeId, setPlaceId] = React.useState<string>("");
  const [lastGeneratedLink, setLastGeneratedLink] = React.useState<string | null>(null);

  const generateLink = useMutation({
    mutationFn: async (input: { placeId: string }) => {
      const trimmed = input.placeId.trim();
      if (!trimmed) {
        throw new Error("Place ID is required.");
      }

      const response = await api.post<ManagerSurveyLinkResponse>(
        `/playsafe/places/${encodeURIComponent(trimmed)}/manager-survey-link`,
      );
      return response.data;
    },
    onSuccess: (data) => {
      setLastGeneratedLink(data.survey_link);
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Manager dashboard</h1>
        <p className="text-sm text-muted-foreground">
          High-level overview across projects, places, and audit outcomes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">3</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Audits completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">24</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">2</div>
            <p className="mt-1 text-xs text-muted-foreground">audits in the last 48 hours</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manager survey link</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2 sm:max-w-md">
            <Label htmlFor="place_id">Place ID</Label>
            <Input
              id="place_id"
              placeholder="e.g. place_123"
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={() => generateLink.mutate({ placeId })}
              disabled={generateLink.isPending}
            >
              {generateLink.isPending ? "Generating…" : "Generate link"}
            </Button>

            {generateLink.isError ? (
              <p className="text-sm text-destructive">
                {generateLink.error instanceof Error
                  ? generateLink.error.message
                  : "Could not generate link."}
              </p>
            ) : null}
          </div>

          {lastGeneratedLink ? (
            <div className="grid gap-2 sm:max-w-2xl">
              <Label>Generated link</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input readOnly value={lastGeneratedLink} />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    if (!navigator.clipboard) return;
                    await navigator.clipboard.writeText(lastGeneratedLink);
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Send this link to external place owners to complete the manager survey.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent audits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DEMO_RECENT_AUDITS.map((row) => {
            return (
              <div
                key={row.id}
                className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.placeName}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(row.completedAtIso)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">audit_score: {row.audit_score}</Badge>
                  <Badge variant={row.combined_score === null ? "outline" : "default"}>
                    combined_score: {row.combined_score ?? "pending"}
                  </Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

