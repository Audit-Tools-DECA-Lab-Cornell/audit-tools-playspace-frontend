import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getServerAudit } from "@/lib/api/playspace-server";
import { getServerAuthSession } from "@/lib/auth/server-session";
import { getQueryClient } from "@/lib/query/server-query-client";

import { ManagerAuditDetailClient } from "./audit-detail-client";

interface ManagerAuditDetailPageProps {
	params: Promise<{ auditId: string }>;
}

export default async function ManagerAuditDetailPage({ params }: Readonly<ManagerAuditDetailPageProps>) {
	const { auditId } = await params;
	const queryClient = getQueryClient();

	const session = await getServerAuthSession();
	const accountId = session?.role === "manager" ? session.accountId : null;

	if (accountId) {
		await queryClient
			.prefetchQuery({
				queryKey: ["playspace", "manager", "audit-detail", auditId, accountId],
				queryFn: () => getServerAudit(auditId)
			})
			.catch(() => undefined);
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<ManagerAuditDetailClient auditId={auditId} />
		</HydrationBoundary>
	);
}
