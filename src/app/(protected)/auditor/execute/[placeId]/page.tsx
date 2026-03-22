import { notFound } from "next/navigation";

import { AuditExecuteForm } from "./audit-form";

type PageParams = {
	placeId?: string | string[];
};

export default async function AuditorExecuteAuditPage({ params }: Readonly<{ params: Promise<PageParams> }>) {
	const resolvedParams = await params;
	const placeIdParam = resolvedParams.placeId;
	const placeId = Array.isArray(placeIdParam) ? placeIdParam[0] : placeIdParam;

	if (!placeId) notFound();

	return <AuditExecuteForm placeId={placeId} />;
}
