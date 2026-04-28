"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ShoppingCart, ListOrdered, Settings2Icon, Package } from "lucide-react";
import { cn } from "@/lib/utils"; // Fungsi helper bawaan shadcn
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useState } from "react";

const sharedNav = [
    { name: "Kasir", href: "/kasir", icon: ShoppingCart },
    { name: "Produk", href: "/products", icon: Package },
    { name: "Draft", href: "/draft", icon: ListOrdered },
];
const adminOnlyNav = [
  { name: "Transaksi", href: "/transactions", icon: ListOrdered },
  { name: "Hutang", href: "/hutang", icon: ListOrdered },
  { name: "Report", href: "/reports", icon: BarChart3 },
];

const lastNav = [
    { name: "Akun", href: "/akun", icon: Settings2Icon },
]



export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [navItems, setNavItems] = useState<{
    name: string;
    href: string;
    icon: any;
  }[]>([]);

  useEffect(() => {
    setNavItems([]);
  }, [])

  useEffect(() => {
    if (user?.role === "admin") {
      setNavItems([...sharedNav, ...adminOnlyNav, ...lastNav]);
    }else{
      setNavItems([...sharedNav, ...lastNav]);
    }
  }, [user?.role]);

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden">
      <div className={cn("grid h-full mx-auto", user?.role === "admin" ? `grid-cols-7` : `grid-cols-4`)}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn("flex flex-col items-center justify-center transition-colors hover:text-primary", isActive ? "bg-red-200" : "bg-white")}
            >
              <item.icon
                className={cn(
                  "w-6 h-6",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-[10px] mt-1",
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}