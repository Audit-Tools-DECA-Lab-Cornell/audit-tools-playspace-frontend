import { notFound } from "next/navigation";

import { AuditExecuteForm } from "./audit-form";

type PageParams = {
	placeId?: string | string[];
};

type PageSearchParams = {
	projectId?: string | string[];
};

export default async function AuditorExecuteAuditPage({
	params,
	searchParams
}: Readonly<{
	params: Promise<PageParams>;
	searchParams: Promise<PageSearchParams>;
}>) {
	const resolvedParams = await params;
	const resolvedSearchParams = await searchParams;
	const placeIdParam = resolvedParams.placeId;
	const projectIdParam = resolvedSearchParams.projectId;
	const placeId = Array.isArray(placeIdParam) ? placeIdParam[0] : placeIdParam;
	const projectId = Array.isArray(projectIdParam) ? projectIdParam[0] : projectIdParam;

	if (!placeId || !projectId) notFound();

	return <AuditExecuteForm placeId={placeId} projectId={projectId} />;
}
