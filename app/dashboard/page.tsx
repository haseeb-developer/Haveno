import type { Metadata } from "next";
import { VaultApp } from "@/components/vault/vault-app";

export const metadata: Metadata = { title: "Your Vault — Haveno" };

export default function DashboardPage() {
  return <VaultApp />;
}
