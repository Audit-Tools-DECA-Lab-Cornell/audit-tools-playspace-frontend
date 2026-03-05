import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectRow {
	id: string;
	name: string;
	places: number;
	auditors: number;
	status: "active" | "archived";
}

const DEMO_PROJECTS: ProjectRow[] = [
	{ id: "proj_001", name: "Citywide Spring 2026", places: 12, auditors: 4, status: "active" },
	{ id: "proj_002", name: "School District Review", places: 7, auditors: 2, status: "active" }
];

export default function ManagerProjectsPage() {
	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
				<p className="text-sm text-muted-foreground">
					Create and manage projects, places, and auditor assignments.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All projects</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{DEMO_PROJECTS.map(project => {
						return (
							<div
								key={project.id}
								className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
								<div className="min-w-0">
									<p className="truncate font-medium">{project.name}</p>
									<p className="text-xs text-muted-foreground">
										{project.places} places • {project.auditors} auditors
									</p>
								</div>
								<Badge variant={project.status === "active" ? "default" : "secondary"}>
									{project.status}
								</Badge>
							</div>
						);
					})}
				</CardContent>
			</Card>
		</div>
	);
}
