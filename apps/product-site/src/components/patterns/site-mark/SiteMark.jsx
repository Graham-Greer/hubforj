import Image from "next/image";

export default function SiteMark() {
  return (
    <span className="site-mark-lockup">
      <Image
        src="/images/hubforj-logo-500-white.webp"
        alt="Hubforj"
        className="site-mark-logo"
        width={500}
        height={126}
        priority
      />
    </span>
  );
}
