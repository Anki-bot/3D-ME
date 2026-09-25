import NavLogo from "./NavLogo";
import NavLinks from "./NavLinks";

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-3 z-[100] flex justify-center px-3 sm:top-6 sm:px-0">
      <div
        className="
          flex
          w-full
          max-w-[calc(100vw-1.5rem)]
          items-center
          justify-between
          gap-3
          rounded-full
          border
          border-white/10
          bg-white/5
          px-3
          py-3
          shadow-[0_8px_40px_rgba(0,0,0,0.35)]
          backdrop-blur-2xl
          supports-[backdrop-filter]:bg-white/5
          sm:w-auto
          sm:max-w-none
          sm:gap-12
          sm:px-8
          sm:py-4
        "
      >
        <NavLogo />
        <NavLinks />
      </div>
    </header>
  );
}