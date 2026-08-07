export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-6">
      <h1 className="text-2xl font-bold tracking-wide">
        IMMERSIVE
      </h1>

      <ul className="flex gap-8 text-sm uppercase">
        <li>Home</li>
        <li>Work</li>
        <li>About</li>
        <li>Contact</li>
      </ul>
    </nav>
  );
}