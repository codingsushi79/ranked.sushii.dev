"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crosshair, Download, Server, Shield, Trophy, User } from "lucide-react";
import { PlayerSearch } from "@/components/player-search";
import type { CurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/download", label: "Download", icon: Download },
];

export function SiteHeader({
  user,
  showServerTab = false,
}: {
  user: CurrentUser | null;
  showServerTab?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Crosshair className="size-5" />
          Ranked CS2
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                pathname === href && "bg-muted text-foreground"
              )}
            >
              <Icon />
              {label}
            </Link>
          ))}
          {showServerTab && (
            <Link
              href="/server"
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                pathname === "/server" && "bg-muted text-foreground"
              )}
            >
              <Server />
              Server
            </Link>
          )}
          {user?.isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                pathname === "/admin" && "bg-muted text-foreground"
              )}
            >
              <Shield />
              Admin
            </Link>
          )}
          {user && (
            <Link
              href="/profile"
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                pathname === "/profile" && "bg-muted text-foreground"
              )}
            >
              <User />
              Profile
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <PlayerSearch className="hidden sm:block" />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" className="gap-2 px-2" />
                }
              >
                <Avatar className="size-7">
                  {user.steamAvatar && (
                    <AvatarImage src={user.steamAvatar} alt={user.username} />
                  )}
                  <AvatarFallback>
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm sm:inline">{user.username}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem render={<Link href={`/players/${user.username}`} />}>
                  View profile
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/profile" />}>
                  Settings
                </DropdownMenuItem>
                {user.isAdmin && (
                  <DropdownMenuItem render={<Link href="/admin" />}>
                    Admin panel
                  </DropdownMenuItem>
                )}
                {showServerTab && (
                  <DropdownMenuItem render={<Link href="/server" />}>
                    Season finale server
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem render={<Link href="/download" />}>
                  Download client
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
