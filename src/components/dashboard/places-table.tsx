import type { PlaceSummary } from "@/lib/api/playspace";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
	formatDateTimeLabel,
	formatLocationLabel,
	formatScoreLabel,
	getPlaceStatusClassName
} from "./utils";

export interface PlacesTableProps {
	places: PlaceSummary[];
	title?: string;
}

/**
 * Project-scoped place summary table used on project overview pages.
 */
export function PlacesTable({ places, title = "Places" }: Readonly<PlacesTableProps>) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent className="overflow-hidden">
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead className="text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
							<tr className="border-b border-border">
								<th className="px-0 py-3 font-medium">Place</th>
								<th className="px-4 py-3 font-medium">Type</th>
								<th className="px-4 py-3 font-medium">Status</th>
								<th className="px-4 py-3 font-medium">Audits</th>
								<th className="px-4 py-3 font-medium">Mean Score</th>
								<th className="px-4 py-3 font-medium">Last Audited</th>
							</tr>
						</thead>
						<tbody>
							{places.map(place => {
								return (
									<tr key={place.id} className="border-b border-border/70 last:border-b-0">
										<td className="px-0 py-4 align-top">
											<div className="space-y-1">
												<p className="font-medium text-foreground">{place.name}</p>
												<p className="text-muted-foreground">{formatLocationLabel(place)}</p>
											</div>
										</td>
										<td className="px-4 py-4 align-top text-muted-foreground">
											{place.place_type ?? "Type pending"}
										</td>
										<td className="px-4 py-4 align-top">
											<Badge variant="outline" className={getPlaceStatusClassName(place.status)}>
												{place.status.replaceAll("_", " ")}
											</Badge>
										</td>
										<td className="px-4 py-4 align-top font-mono text-foreground">
											{place.audits_completed}
										</td>
										<td className="px-4 py-4 align-top font-mono text-foreground">
											{formatScoreLabel(place.average_score)}
										</td>
										<td className="px-4 py-4 align-top text-muted-foreground">
											{formatDateTimeLabel(place.last_audited_at)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
}
