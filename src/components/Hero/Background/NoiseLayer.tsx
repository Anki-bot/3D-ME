export default function NoiseLayer() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-[0.025] mix-blend-soft-light"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, white 0.8px, transparent 0)",
        backgroundSize: "20px 20px",
      }}
    />
  );
}