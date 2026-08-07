"use client";

import { useActiveSection } from "@/hooks/navigation/useActiveSection";

const links = [
  { label: "Home", href: "#home", id: "home" },
  { label: "About", href: "#about", id: "about" },
  { label: "Work", href: "#projects", id: "projects" },
  { label: "Contact", href: "#contact", id: "contact" },
];

export default function NavLinks() {
  const activeSection = useActiveSection();

  return (
    <nav>
      <ul className="flex items-center gap-10">
        {links.map((link) => {
          const isActive = activeSection === link.id;

          return (
            <li key={link.label}>
              <a
                href={link.href}
                className={`
                  relative
                  text-sm
                  font-medium
                  uppercase
                  tracking-[0.28em]
                  transition-all
                  duration-300
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