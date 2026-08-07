import GlowOrb from "./GlowOrb";

export default function GradientLayer() {
  return (
    <>
      <GlowOrb
        className="absolute left-[8%] top-[12%] h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-[180px]"
        x={40}
        y={30}
        duration={10}
      />

      <GlowOrb
        className="absolute right-[8%] bottom-[10%] h-[560px] w-[560px] rounded-full bg-violet-500/10 blur-[200px]"
        x={-35}
        y={-25}
        duration={12}
      />

      <GlowOrb
        className="absolute left-1/2 top-1/2 h-[850px] w-[850px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-[220px]"
        x={0}
        y={20}
        duration={14}
      />
    </>
  );
}