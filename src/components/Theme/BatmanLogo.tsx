import Image from "next/image";

export default function BatmanLogo({ className = "h-6 w-10" }: { className?: string }) {
  return (
    <div className={`${className} relative flex items-center justify-center overflow-hidden`}>
      <Image
        src="/images/batman-logo.png"
        alt="Batman"
        width={80}
        height={32}
        className="h-full w-full object-contain"
        priority
      />
    </div>
  );
}
