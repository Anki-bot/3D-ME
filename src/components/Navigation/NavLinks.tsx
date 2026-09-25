"use client";

import {
  getNavigationAriaCurrent,
  useActiveSection,
} from "@/hooks/navigation/useActiveSection";

const links = [
  { label: "Home", href: "#home", id: "home" },
  { label: "About", href: "#about", id: "about" },
  { label: "Work", href: "#projects", id: "projects" },
] as const;

export default function NavLinks() {
  const activeSection = useActiveSection();

  return (
    <nav aria-label="Primary" className="min-w-0">
      <ul className="flex items-center gap-3 sm:gap-10">
        {links.map((link) => {
          const isActive = activeSection === link.id;

          return (
            <li key={link.label}>
              <a
                href={link.href}
                aria-current={getNavigationAriaCurrent(activeSection, link.id)}
                className={`
                  relative
                  inline-flex
                  min-h-9
                  items-center
                  whitespace-nowrap
                  rounded-sm
                  text-[0.6875rem]
                  font-medium
                  uppercase
                  tracking-[0.16em]
                  transition-all
                  duration-300
                  focus-visible:outline-2
                  focus-visible:outline-offset-4
                  focus-visible:outline-white
                  sm:min-h-0
                  sm:text-sm
                  sm:tracking-[0.28em]
                  ${
                    isActive
                      ? "text-white"
                      : "text-gray-400 hover:text-white"
                  }
                `}
              >
                {link.label}

                <span
                  className={`
                    absolute
                    left-0
                    -bottom-2
                    h-[2px]
                    bg-white
                    transition-all
                    duration-300
                    ${
                      isActive
                        ? "w-full opacity-100"
                        : "w-0 opacity-0"
                    }
                  `}
                />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}