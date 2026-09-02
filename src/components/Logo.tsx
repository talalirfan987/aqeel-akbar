import Image from "next/image";

export default function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <Image
      src="/images/logo.png"
      alt="Akeel Akbar Lottery logo"
      width={40}
      height={40}
      className={`${className} rounded-full object-cover`}
      priority
    />
  );
}
