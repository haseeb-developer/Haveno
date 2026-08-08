import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { VaultProvider } from "@/components/providers/vault-provider";
import { ROUTES } from "@/constants/routes";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader email={user.email ?? null} />
      <VaultProvider>{children}</VaultProvider>
    </div>
  );
}
