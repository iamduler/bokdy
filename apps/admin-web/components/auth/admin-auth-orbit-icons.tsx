import type { SVGProps } from "react";
import { Dumbbell, Trophy, Volleyball } from "lucide-react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function svgProps({ size = 18, className, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true as const,
    ...rest,
  };
}

/** Simple soccer ball */
export function SoccerIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v3.5M12 17.5V21M3.5 9.5l3 1.5M17.5 13l3 1.5M3.5 14.5l3-1.5M17.5 11l3-1.5" />
      <path d="M12 8.5 9.5 11l1 3h3l1-3Z" />
    </svg>
  );
}

/** Tennis ball */
export function TennisIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M6 5.5c3.5 2 5 5.5 5 10.5" />
      <path d="M18 18.5c-3.5-2-5-5.5-5-10.5" />
    </svg>
  );
}

/** Badminton shuttlecock */
export function BadmintonIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M12 14c2.5 0 4.5-2.2 4.5-4.5S14.5 5 12 5 7.5 7.2 7.5 9.5 9.5 14 12 14Z" />
      <path d="M9.2 13.2 8 20h8l-1.2-6.8" />
      <path d="M10 20h4" />
      <path d="M12 5V3M9.5 6.2 8 4.5M14.5 6.2 16 4.5" />
    </svg>
  );
}

/** Table tennis paddle + ball */
export function TableTennisIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M8.5 14.5c-2.8-2.8-2.6-7.2.5-9.7a6.2 6.2 0 0 1 8.7.4c2.6 3 .8 7.3-2.5 9.2L12 16Z" />
      <path d="M11.5 15.5 8 21" />
      <circle cx="17.5" cy="7.5" r="2.2" />
    </svg>
  );
}

/** Basketball */
export function BasketballIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c2.5 3 2.5 15 0 18M3 12h18" />
      <path d="M5.5 6.5c4 2.5 9 2.5 13 0M5.5 17.5c4-2.5 9-2.5 13 0" />
    </svg>
  );
}

export function VolleyballIcon(props: IconProps) {
  return <Volleyball size={props.size ?? 18} className={props.className} aria-hidden />;
}

export function FitnessIcon(props: IconProps) {
  return <Dumbbell size={props.size ?? 18} className={props.className} aria-hidden />;
}

export function TrophyIcon(props: IconProps) {
  return <Trophy size={props.size ?? 18} className={props.className} aria-hidden />;
}
