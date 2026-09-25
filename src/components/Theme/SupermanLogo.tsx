import Image from "next/image";

export default function SupermanLogo({ className = "h-7 w-6" }: { className?: string }) {
  return (
    <div className={`${className} relative flex items-center justify-center overflow-hidden`}>
      <Image
        src="/images/superman-logo.png"
        alt="Superman"
        width={48}
        height={64}
        className="h-full w-full object-contain"
        priority
      />
    </div>
  );
}
