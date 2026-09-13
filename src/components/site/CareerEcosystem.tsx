import Image from 'next/image';
import './portrait-ecosystem.css';

export default function CareerEcosystem() {
  return (
    <figure
      className="portrait-ecosystem"
      aria-label="Students, employers, and universities connected through Nextern"
    >
      <div className="ecosystem-portrait portrait-academic">
        <Image
          src="/illustrations/nextern-university-cutout.png"
          alt="University representative holding an academic folder"
          width={1024}
          height={1536}
          sizes="(max-width: 560px) 49vw, (max-width: 800px) 260px, (max-width: 1100px) 240px, 280px"
          priority
        />
      </div>
      <div className="ecosystem-portrait portrait-recruiter">
        <Image
          src="/illustrations/nextern-employer-cutout.png"
          alt="Employer in a forest-green blazer"
          width={1024}
          height={1536}
          sizes="(max-width: 560px) 52vw, (max-width: 800px) 276px, (max-width: 1100px) 255px, 296px"
          priority
        />
      </div>
      <div className="ecosystem-portrait portrait-student">
        <Image
          src="/illustrations/nextern-student-cutout.png"
          alt="University student with a notebook and backpack"
          width={1024}
          height={1536}
          sizes="(max-width: 560px) 57vw, (max-width: 800px) 302px, (max-width: 1100px) 280px, 325px"
          priority
        />
      </div>

      <figcaption>Student ambition, employer opportunity, and university support.</figcaption>
    </figure>
  );
}
