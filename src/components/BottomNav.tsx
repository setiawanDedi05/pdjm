"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ShoppingCart, ListOrdered, Settings2Icon } from "lucide-react";
import { cn } from "@/lib/utils"; // Fungsi helper bawaan shadcn

const navItems = [
    { name: "Report", href: "/reports", icon: BarChart3 },
    { name: "Kasir", href: "/kasir", icon: ShoppingCart },
    { name: "Transaksi", href: "/transactions", icon: ListOrdered },
    { name: "Pengaturan", href: "/akun", icon: Settings2Icon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden">
      <div className="grid h-full grid-cols-4 mx-auto">
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