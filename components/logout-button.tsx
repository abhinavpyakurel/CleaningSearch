"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
  variant?: "nav" | "button";
};

export function LogoutButton({
  className,
  children,
  showIcon = true,
  variant = "nav",
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/logout", { method: "POST" });

      if (!response.ok) {
        setLoading(false);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  if (variant === "button") {
    return (
      <Button
        variant="ghost"
        size="sm"
        type="button"
        disabled={loading}
        onClick={handleLogout}
      >
        {loading ? "Logging out…" : (children ?? "Log out")}
      </Button>
    );
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleLogout}
      className={cn(
        "flex items-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-50",
        className
      )}
    >
      {showIcon ? <LogOut className="size-4 shrink-0" /> : null}
      {loading ? <span>Logging out…</span> : (children ?? <span>Log out</span>)}
    </button>
  );
}
