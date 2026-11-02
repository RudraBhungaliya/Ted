"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authApi } from "../../lib/api/endpoints";

interface NavbarProps {
  user?: {
    fullName?: string | null;
    email?: string | null;
  } | null;
  onLogout?: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(user || null);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
      return;
    }
    authApi
      .me()
      .then((res) => {
        if (res?.data) {
          setCurrentUser(res.data);
        }
      })
      .catch(() => {});
  }, [user]);

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
    }
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await authApi.logout();
    } catch (err) {
      console.error(err);
    } finally {
      window.location.href = "/login";
    }
  };

  const navItems = [
    { label: "Workspace", href: "/" },
    { label: "History", href: "/history" },
    { label: "Analytics", href: "/dashboard" },
    { label: "Billing", href: "/billing" },
  ];

  const userInitial = currentUser?.fullName
    ? currentUser.fullName.charAt(0).toUpperCase()
    : currentUser?.email
    ? currentUser.email.charAt(0).toUpperCase()
    : "T";

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-stone-200/80">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-stone-900 text-stone-50 flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-stone-800 transition-colors">
            T
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-base tracking-tight text-stone-900">
              Ted
            </span>
            <span className="text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200 hidden sm:inline-block">
              Notes & Voice
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-xs sm:text-sm px-3 py-1.5 rounded-full font-medium transition-all ${
                  isActive
                    ? "bg-stone-900 text-white shadow-xs"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User profile & actions */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
              <div
                title={currentUser.fullName || currentUser.email || "User"}
                className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 border border-amber-300/80 flex items-center justify-center text-xs font-bold shadow-2xs"
              >
                {userInitial}
              </div>
              <span className="text-xs font-medium text-stone-700 hidden md:inline-block max-w-[120px] truncate">
                {currentUser.fullName || currentUser.email}
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="text-xs font-medium text-stone-500 hover:text-rose-600 px-2 py-1 rounded-md transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

