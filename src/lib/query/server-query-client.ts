import { QueryClient } from "@tanstack/react-query";

/**
 * Per-request server QueryClient.
 *
 * Every server component that wants to prefetch should call this helper, run
 * `prefetchQuery`/`setQueryData` against the result, then pass the dehydrated
 * state to a <HydrationBoundary>. A new client per request keeps state
 * isolated between concurrent renders. Defaults mirror the browser-side query
 * defaults defined in src/app/providers.tsx so server-side prefetch and
 * client-side useQuery agree on staleness.
 */
export function getQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: 1,
				staleTime: 30_000
			}
		}
	});
}
