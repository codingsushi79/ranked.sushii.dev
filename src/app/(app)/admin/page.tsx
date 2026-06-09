import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { listAdminUsers, listAdminMatches } from "@/lib/admin-data";
import { AdminPanel } from "@/components/admin-panel";

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const [users, matches] = await Promise.all([
    listAdminUsers(),
    listAdminMatches(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-muted-foreground">
          Manage users, matches, and platform settings.
        </p>
      </div>
      <AdminPanel
        initialUsers={users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        }))}
        initialMatches={matches.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
