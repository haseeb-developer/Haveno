import { redirect } from "next/navigation";
import { getRequestUser } from "@/lib/supabase/current-user";
import { fetchTermsAcknowledgedServer } from "@/lib/supabase/profile-server";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { VaultProvider } from "@/components/providers/vault-provider";
import { TermsSecurityGate } from "@/components/terms/terms-security-gate";
import { ROUTES } from "@/constants/routes";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getRequestUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const hasAcknowledgedTerms = await fetchTermsAcknowledgedServer();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader email={user.email ?? null} />
      {hasAcknowledgedTerms ? (
        <VaultProvider>{children}</VaultProvider>
      ) : (
        <TermsSecurityGate userId={user.id} />
      )}
    </div>
  );
}
