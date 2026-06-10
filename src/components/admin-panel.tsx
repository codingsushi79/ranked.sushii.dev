"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { LoadingButton } from "@/components/motion/loading-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AdminUser = {
  id: string;
  username: string;
  email: string | null;
  emailVerified: boolean;
  isAdmin: boolean;
  steamId: string | null;
  steamName: string | null;
  createdAt: string;
};

type AdminMatch = {
  id: string;
  externalId: string;
  map: string;
  mode: string;
  team0Score: number | null;
  team1Score: number | null;
  winnerTeam: number;
  createdAt: string;
  playerCount: number;
};

export function AdminPanel({
  initialUsers,
  initialMatches,
}: {
  initialUsers: AdminUser[];
  initialMatches: AdminMatch[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [matches, setMatches] = useState(initialMatches);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  async function refreshUsers() {
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok) setUsers(data.users);
    } finally {
      setSearching(false);
    }
  }

  async function toggleAdmin(userId: string, isAdmin: boolean) {
    setLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isAdmin: data.user.isAdmin } : u))
      );
      toast.success(isAdmin ? "Admin granted" : "Admin revoked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  async function verifyEmail(userId: string) {
    setLoading(`verify-${userId}`);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailVerified: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, emailVerified: true } : u
        )
      );
      toast.success("Email verified");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  async function deleteMatch(matchId: string) {
    if (!confirm("Delete this match and revert player stats?")) return;
    setLoading(`match-${matchId}`);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
      toast.success("Match deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  const filteredUsers = search
    ? users.filter(
        (u) =>
          u.username.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <Tabs defaultValue="users" className="animate-in fade-in duration-500 fill-mode-both">
      <TabsList>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="matches">Matches</TabsTrigger>
      </TabsList>

      <TabsContent value="users" className="mt-4">
        <Card className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage accounts, admin access, and verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search username or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <LoadingButton
                variant="outline"
                onClick={refreshUsers}
                loading={searching}
                loadingLabel="Searching…"
              >
                Search
              </LoadingButton>
            </div>
            {searching ? (
              <div className="flex flex-col gap-2 animate-in fade-in duration-300">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-10 w-full animate-ranked-shimmer"
                    style={{ animationDelay: `${i * 75}ms` }}
                  />
                ))}
              </div>
            ) : (
            <Table className="animate-in fade-in duration-500 fill-mode-both">
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u, i) => (
                  <TableRow
                    key={u.id}
                    className="animate-in fade-in slide-in-from-bottom-1 duration-300 fill-mode-both"
                    style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                  >
                    <TableCell>
                      <Link
                        href={`/players/${u.username}`}
                        className="font-medium hover:underline"
                      >
                        {u.username}
                      </Link>
                      {u.steamName && (
                        <p className="text-xs text-muted-foreground">
                          {u.steamName}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{u.email ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.isAdmin && <Badge>Admin</Badge>}
                        {u.emailVerified ? (
                          <Badge variant="secondary">Verified</Badge>
                        ) : (
                          <Badge variant="outline">Unverified</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!u.emailVerified && (
                          <LoadingButton
                            size="sm"
                            variant="outline"
                            loading={loading === `verify-${u.id}`}
                            loadingLabel="…"
                            onClick={() => verifyEmail(u.id)}
                          >
                            Verify
                          </LoadingButton>
                        )}
                        <LoadingButton
                          size="sm"
                          variant={u.isAdmin ? "secondary" : "outline"}
                          loading={loading === u.id}
                          loadingLabel="…"
                          onClick={() => toggleAdmin(u.id, !u.isAdmin)}
                        >
                          {u.isAdmin ? "Revoke admin" : "Make admin"}
                        </LoadingButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="matches" className="mt-4">
        <Card className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both delay-75">
          <CardHeader>
            <CardTitle>Matches</CardTitle>
            <CardDescription>
              Recent rated matches. Deleting reverts Elo and season stats.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table className="animate-in fade-in duration-500 fill-mode-both">
              <TableHeader>
                <TableRow>
                  <TableHead>Map</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((m, i) => (
                  <TableRow
                    key={m.id}
                    className="animate-in fade-in slide-in-from-bottom-1 duration-300 fill-mode-both"
                    style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                  >
                    <TableCell>
                      <Link
                        href={`/matches/${m.id}`}
                        className="hover:underline"
                      >
                        {m.map}
                      </Link>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {m.team0Score != null && m.team1Score != null
                        ? `${m.team0Score} – ${m.team1Score}`
                        : "—"}
                    </TableCell>
                    <TableCell>{m.playerCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(m.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <LoadingButton
                        size="sm"
                        variant="destructive"
                        loading={loading === `match-${m.id}`}
                        loadingLabel="…"
                        onClick={() => deleteMatch(m.id)}
                      >
                        Delete
                      </LoadingButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
