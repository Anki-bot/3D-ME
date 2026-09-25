import GlowOrb from "./GlowOrb";

export default function GradientLayer() {
  return (
    <>
      <GlowOrb
        className="absolute left-[6%] top-[10%] h-[480px] w-[480px] rounded-full bg-white/[0.045] blur-[180px]"
        x={35}
        y={25}
        duration={12}
      />

      <GlowOrb
        className="absolute right-[6%] bottom-[8%] h-[520px] w-[520px] rounded-full bg-white/[0.035] blur-[200px]"
        x={-30}
        y={-20}
        duration={14}
      />

      <GlowOrb
        className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.025] blur-[220px]"
        x={0}
        y={20}
        duration={16}
      />
    </>
  );
}