import Image from "next/image";
import { clientLogos } from "@/content/brand-clients";

export function BrandClientWall({ placement = "brand" }: { placement?: "brand" | "home" }) {
  return (
    <section className={`brand-client-wall${placement === "home" ? " home-client-wall" : ""}`}>
      <div className="brand-section-head split">
        <div>
          <p className="kicker">Selected client experience</p>
          <h2>BRANDS I&apos;VE HELPED BUILD.</h2>
        </div>
        <p>My work spans technology, hospitality, entertainment, finance, consumer products, real estate, and professional services.</p>
      </div>
      <div className="brand-client-grid" aria-label="Selected client logos">
        {clientLogos.map((logo) => (
          <div className={`brand-client-mark${logo.treatment ? ` brand-client-mark-${logo.treatment}` : ""}`} data-client={logo.name} key={logo.name}>
            <Image src={logo.src} alt={logo.name} fill sizes="(max-width: 640px) 50vw, (max-width: 980px) 33vw, 25vw" />
          </div>
        ))}
      </div>
    </section>
  );
}
