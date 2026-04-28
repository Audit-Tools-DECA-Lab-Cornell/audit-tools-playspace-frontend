import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getServerAudit } from "@/lib/api/playspace-server";
import { getQueryClient } from "@/lib/query/server-query-client";

import { AdminAuditDetailClient } from "./audit-detail-client";

interface AdminAuditDetailPageProps {
	params: Promise<{ auditId: string }>;
}

export default async function AdminAuditDetailPage({ params }: Readonly<AdminAuditDetailPageProps>) {
	const { auditId } = await params;
	const queryClient = getQueryClient();

	await queryClient
		.prefetchQuery({
			queryKey: ["playspace", "admin", "audit-detail", auditId],
			queryFn: () => getServerAudit(auditId)
		})
		.catch(() => undefined);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<AdminAuditDetailClient auditId={auditId} />
		</HydrationBoundary>
	);
}
