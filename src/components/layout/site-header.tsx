"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ThemeToggle } from "./theme-toggle";

const navGroups = [
  {
    title: "Writing",
    items: [
      { url: "/blogs", label: "Blogs" },
      { url: "/thoughts", label: "Thoughts" },
      { url: "/portfolio", label: "Portfolio" },
      { url: "/tags", label: "Tags" },
    ],
  },
  {
    title: "More",
    items: [
      { url: "/about", label: "About" },
      { url: "/admin", label: "Admin" },
    ],
  },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [close]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <header className="site-header">
      <Link href="/" className="site-title" onClick={close}>
        pkg/nayan
      </Link>
      <div className="header-actions">
        <ThemeToggle />
        <div className="nav-menu" ref={ref}>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="nav-toggle__bars" aria-hidden="true" />
          </button>
          <nav
            id="site-menu"
            className={`site-menu${open ? " is-open" : ""}`}
            aria-label="Primary"
            hidden={!open}
          >
            <div className="site-menu__cols">
              {navGroups.map((group) => (
                <div key={group.title} className="site-menu__group">
                  <p className="site-menu__eyebrow">{group.title}</p>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item.url}>
                        <Link href={item.url} onClick={close}>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
