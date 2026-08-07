export default function NoiseLayer() {
  return (
    <div
      className="
        absolute
        inset-0
        opacity-[0.03]
        mix-blend-soft-light
        pointer-events-none
      "
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
        backgroundSize: "18px 18px",
      }}
    />
  );
}