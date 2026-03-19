import Link from "next/link";

import type { ProjectSummary } from "@/lib/api/playspace";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { formatProjectDateRange, formatScoreLabel, getProjectStatusClassName } from "./utils";

export interface ProjectsTableProps {
	projects: ProjectSummary[];
	basePath?: string;
	title?: string;
}

/**
 * Project listing shared by the dashboard and dedicated projects screen.
 */
export function ProjectsTable({
	projects,
	basePath = "/manager/projects",
	title = "Projects"
}: Readonly<ProjectsTableProps>) {
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
								<th className="px-0 py-3 font-medium">Project</th>
								<th className="px-4 py-3 font-medium">Date Range</th>
								<th className="px-4 py-3 font-medium">Coverage</th>
								<th className="px-4 py-3 font-medium">Mean Score</th>
								<th className="px-4 py-3 font-medium">Status</th>
							</tr>
						</thead>
						<tbody>
							{projects.map(project => {
								return (
									<tr key={project.id} className="border-b border-border/70 last:border-b-0">
										<td className="px-0 py-4 align-top">
											<div className="space-y-1">
												<Link
													href={`${basePath}/${encodeURIComponent(project.id)}`}
													className="font-medium text-foreground transition-colors hover:text-primary">
													{project.name}
												</Link>
												<p className="max-w-md text-muted-foreground">
													{project.overview ?? "Overview pending."}
												</p>
											</div>
										</td>
										<td className="px-4 py-4 align-top text-muted-foreground">
											{formatProjectDateRange(project)}
										</td>
										<td className="px-4 py-4 align-top text-muted-foreground">
											{project.places_count} places
											<br />
											{project.auditors_count} auditors
										</td>
										<td className="px-4 py-4 align-top font-mono text-foreground">
											{formatScoreLabel(project.average_score)}
										</td>
										<td className="px-4 py-4 align-top">
											<Badge
												variant="outline"
												className={getProjectStatusClassName(project.status)}>
												{project.status}
											</Badge>
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
