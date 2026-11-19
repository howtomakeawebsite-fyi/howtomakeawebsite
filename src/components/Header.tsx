"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useOpenUntilNavigate } from "@/lib/hooks";
import { mainNav, site } from "@/config/site";
import { Icon } from "./Icon";
import { ThemeToggle } from "./ThemeToggle";
import { SearchButton } from "./Search";
import { notificationsReady } from "./PushNotifications";

function Logo() {
  return (
    <Link href="/" className="flex min-w-0 shrink items-center gap-2.5" aria-label={`${site.name}, home`}>
      {/* The logo is public/brand/logo-mark.svg. Replace that file with your own logo (keep the name). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-mark.svg" alt="" width={44} height={44} className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
      <span className="truncate font-display text-base font-bold leading-tight sm:text-lg">{site.name}</span>
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useOpenUntilNavigate();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const t = setTimeout(onScroll, 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { clearTimeout(t); window.removeEventListener("scroll", onScroll); };
  }, []);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  return (
    // No backdrop-filter here: it would trap the full-screen menu and search inside the header.
    <header className={`sticky top-0 z-50 border-b bg-bg transition-[border-color,box-shadow] duration-300 ${scrolled ? "border-line shadow-soft" : "border-transparent"}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:h-[4.5rem] sm:px-6">
        <Logo />
        <nav aria-label="Main" className="ml-2 hidden flex-1 xl:block">
          <ul className="flex items-center gap-0.5">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={isActive(pathname, item.href) ? "page" : undefined} className={`whitespace-nowrap rounded-full px-3 py-2 text-[0.95rem] font-semibold transition-colors hover:bg-panel ${isActive(pathname, item.href) ? "text-accent" : ""}`}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <SearchButton />
          {/* The bell opens the Notifications page. It shows once the notification keys are set in Vercel. */}
          {notificationsReady && (
            <Link href="/notifications/" className="grid h-10 w-10 place-items-center rounded-full hover:bg-panel" aria-label="Notifications" title="Notifications"><Icon name="bell" /></Link>
          )}
          <ThemeToggle />
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full hover:bg-panel xl:hidden" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
            <Icon name="menu" />
          </button>
        </div>
      </div>

      {/* Menu on phones and tablets */}
      <div className={`fixed inset-0 z-50 xl:hidden ${menuOpen ? "" : "pointer-events-none"}`} aria-hidden={!menuOpen}>
        <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setMenuOpen(false)} />
        <div role="dialog" aria-modal="true" aria-label="Menu" className={`absolute inset-y-0 right-0 flex w-[min(24rem,90vw)] flex-col bg-bg shadow-soft transition-transform duration-300 ${menuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="font-display text-xl font-semibold">Menu</span>
            <button type="button" className="grid h-10 w-10 place-items-center rounded-full hover:bg-panel" aria-label="Close menu" onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1}>
              <Icon name="close" />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
            {mainNav.map((item) => (
              <Link key={item.href} href={item.href} aria-current={isActive(pathname, item.href) ? "page" : undefined} className={`block rounded-xl px-3 py-3 text-lg font-semibold hover:bg-panel ${isActive(pathname, item.href) ? "text-accent" : ""}`} tabIndex={menuOpen ? 0 : -1}>
                {item.label}
              </Link>
            ))}
            <Link href="/search/" className="mt-2 flex items-center gap-2 rounded-xl px-3 py-3 text-lg font-semibold hover:bg-panel" tabIndex={menuOpen ? 0 : -1}><Icon name="search" className="h-5 w-5" /> Search</Link>
            {notificationsReady && <Link href="/notifications/" className="flex items-center gap-2 rounded-xl px-3 py-3 text-lg font-semibold hover:bg-panel" tabIndex={menuOpen ? 0 : -1}><Icon name="bell" className="h-5 w-5" /> Notifications</Link>}
            <Link href="/get-our-app/" className="flex items-center gap-2 rounded-xl px-3 py-3 text-lg font-semibold hover:bg-panel" tabIndex={menuOpen ? 0 : -1}><Icon name="smartphone" className="h-5 w-5" /> Get our app</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
