"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/app", label: "Tableau de bord" },
  { href: "/app/poids", label: "Mon poids" },
  { href: "/app/journal", label: "Journal" },
  { href: "/app/activites", label: "Activités" },
  { href: "/app/programme", label: "Programme" },
  { href: "/app/abonnement", label: "Abonnement" },
  { href: "/app/compte", label: "Mon compte" },
];

export function AppNav({ admin }: { admin: boolean }) {
  const pathname = usePathname();
  const links = admin ? [...LINKS, { href: "/admin", label: "Administration" }] : LINKS;
  return (
    <nav aria-label="Navigation principale" className="overflow-x-auto px-2 pb-2 lg:px-3 lg:pb-0">
      <ul className="flex gap-1 lg:flex-col">
        {links.map((l) => {
          const active = l.href === "/app" ? pathname === "/app" : pathname.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap rounded-full px-3.5 py-2 font-medium lg:rounded-lg ${
                  active ? "bg-feuille text-blanc" : "hover:bg-brume"
                }`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
