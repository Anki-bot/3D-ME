import NavLogo from "./NavLogo";
import NavLinks from "./NavLinks";

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-6 z-[100] flex justify-center">
      <div
        className="
          flex
          items-center
          justify-between
          gap-12
          rounded-full
          border
          border-white/10
          bg-white/5
          px-8
          py-4
          shadow-[0_8px_40px_rgba(0,0,0,0.35)]
          backdrop-blur-2xl
          supports-[backdrop-filter]:bg-white/5
        "
      >
        <NavLogo />
        <NavLinks />
      </div>
    </header>
  );
}