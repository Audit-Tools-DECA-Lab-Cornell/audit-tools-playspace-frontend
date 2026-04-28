import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getServerAudit } from "@/lib/api/playspace-server";
import { getQueryClient } from "@/lib/query/server-query-client";

import { AuditorReportDetailClient } from "./report-detail-client";

interface AuditorReportDetailPageProps {
	params: Promise<{ auditId: string }>;
}

export default async function AuditorReportDetailPage({ params }: Readonly<AuditorReportDetailPageProps>) {
	const { auditId } = await params;
	const queryClient = getQueryClient();

	await queryClient
		.prefetchQuery({
			queryKey: ["playspace", "auditor", "audit", auditId],
			queryFn: () => getServerAudit(auditId)
		})
		.catch(() => undefined);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<AuditorReportDetailClient auditId={auditId} />
		</HydrationBoundary>
	);
}
