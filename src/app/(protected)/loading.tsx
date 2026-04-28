import { ProtectedShellSkeleton } from "@/components/dashboard/page-skeletons";

/**
 * Default streaming fallback for any protected route.
 * Renders inside the AppShell layout slot.
 */
export default function ProtectedLoading() {
	return <ProtectedShellSkeleton />;
}
