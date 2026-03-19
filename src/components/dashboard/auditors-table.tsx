import type { AuditorSummary } from "@/lib/api/playspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { formatDateTimeLabel } from "./utils";

export interface AuditorsTableProps {
	auditors: AuditorSummary[];
	title?: string;
}

/**
 * Manager-facing auditor list for account dashboard screens.
 */
export function AuditorsTable({ auditors, title = "Auditors" }: Readonly<AuditorsTableProps>) {
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
								<th className="px-0 py-3 font-medium">Auditor</th>
								<th className="px-4 py-3 font-medium">Role</th>
								<th className="px-4 py-3 font-medium">Assignments</th>
								<th className="px-4 py-3 font-medium">Completed</th>
								<th className="px-4 py-3 font-medium">Last Active</th>
							</tr>
						</thead>
						<tbody>
							{auditors.map(auditor => {
								return (
									<tr key={auditor.id} className="border-b border-border/70 last:border-b-0">
										<td className="px-0 py-4 align-top">
											<div className="space-y-1">
												<div className="flex flex-wrap items-center gap-2">
													<p className="font-medium text-foreground">{auditor.full_name}</p>
													<span className="font-mono text-xs text-primary">
														{auditor.auditor_code}
													</span>
												</div>
												<p className="text-muted-foreground">
													{auditor.email ?? "Email pending"}
												</p>
											</div>
										</td>
										<td className="px-4 py-4 align-top text-muted-foreground">
											{auditor.role ?? "Role pending"}
										</td>
										<td className="px-4 py-4 align-top font-mono text-foreground">
											{auditor.assignments_count}
										</td>
										<td className="px-4 py-4 align-top font-mono text-foreground">
											{auditor.completed_audits}
										</td>
										<td className="px-4 py-4 align-top text-muted-foreground">
											{formatDateTimeLabel(auditor.last_active_at)}
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
