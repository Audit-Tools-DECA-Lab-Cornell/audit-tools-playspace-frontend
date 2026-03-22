"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";

import { PreferencesProvider } from "@/components/app/preferences-provider";

export interface ProvidersProps {
	children: React.ReactNode;
}

/**
 * App-wide client providers (React Query, etc.).
 */
export function Providers({ children }: Readonly<ProvidersProps>) {
	const [queryClient] = React.useState(() => {
		return new QueryClient({
			defaultOptions: {
				queries: {
					retry: 1,
					staleTime: 30_000,
					refetchOnWindowFocus: false
				},
				mutations: {
					retry: 0
				}
			}
		});
	});

	return (
		<PreferencesProvider>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</PreferencesProvider>
	);
}
