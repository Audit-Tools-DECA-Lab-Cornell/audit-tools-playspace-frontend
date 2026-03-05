import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AuditStatus = "pending" | "in_progress" | "completed";

interface AssignedPlaceRow {
  placeId: string;
  placeName: string;
  status: AuditStatus;
}

const DEMO_ASSIGNED_PLACES: AssignedPlaceRow[] = [
  { placeId: "place_123", placeName: "Riverside Park", status: "pending" },
  { placeId: "place_456", placeName: "Maple Street Playground", status: "in_progress" },
  { placeId: "place_789", placeName: "Oakview Green", status: "completed" },
];

function getStatusBadgeVariant(status: AuditStatus) {
  if (status === "completed") return "default";
  if (status === "in_progress") return "secondary";
  return "outline";
}

export default function AuditorDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Auditor dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your assigned places and audit execution tasks.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned places</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DEMO_ASSIGNED_PLACES.map((row) => {
            const actionHref = `/auditor/execute/${encodeURIComponent(row.placeId)}`;

            const actionLabel = row.status === "in_progress" ? "Resume audit" : "Start audit";

            return (
              <div
                key={row.placeId}
                className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.placeName}</p>
                  <p className="text-xs text-muted-foreground">{row.placeId}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(row.status)}>{row.status}</Badge>
                  {row.status === "completed" ? (
                    <Button type="button" variant="secondary" disabled>
                      Report available
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link href={actionHref}>{actionLabel}</Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

