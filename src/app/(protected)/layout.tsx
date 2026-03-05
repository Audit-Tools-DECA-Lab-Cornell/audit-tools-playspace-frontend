import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { getServerAuthSession } from "@/lib/auth/server-session";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  if (!session) redirect("/login");

  return (
    <AppShell role={session.role} auditorCode={session.auditorCode}>
      {children}
    </AppShell>
  );
}

