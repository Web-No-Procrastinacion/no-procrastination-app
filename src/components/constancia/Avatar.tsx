import { gamification } from "@/config/gamification";
import { cn } from "@/lib/utils";

interface AvatarProps {
  stage: number;
  size?: number;
  silhouette?: boolean;
  className?: string;
  decorative?: boolean;
}

/** Avatar provisional en SVG: huevo → huevo agrietado → cría → joven → adulto → pleno. */
export function Avatar({ stage, size = 120, silhouette = false, className, decorative }: AvatarProps) {
  const name = gamification.etapasAvatar[stage] ?? gamification.etapasAvatar[0];
  const c = silhouette
    ? {
        shell: "fill-avatar-silhouette",
        shade: "fill-avatar-silhouette",
        body: "fill-avatar-silhouette",
        belly: "fill-avatar-silhouette",
        beak: "fill-avatar-silhouette",
        ink: "fill-avatar-silhouette",
        stroke: "stroke-avatar-silhouette",
      }
    : {
        shell: "fill-avatar-shell",
        shade: "fill-avatar-shell-shade",
        body: "fill-avatar-body",
        belly: "fill-avatar-belly",
        beak: "fill-avatar-beak",
        ink: "fill-avatar-ink",
        stroke: "stroke-avatar-ink",
      };

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : silhouette ? `Etapa futura: ${name}` : `Avatar en etapa ${name}`}
    >
      {/* sombra */}
      <ellipse cx="60" cy="108" rx="30" ry="5" className="fill-avatar-silhouette" opacity={0.6} />
      {stage === 0 && (
        <g>
          <ellipse cx="60" cy="64" rx="30" ry="40" className={c.shell} />
          <ellipse cx="50" cy="48" rx="7" ry="10" className={c.shade} opacity={0.6} />
          <circle cx="70" cy="80" r="4" className={c.shade} />
          <circle cx="56" cy="88" r="2.5" className={c.shade} />
          <ellipse cx="60" cy="64" rx="30" ry="40" fill="none" strokeWidth={2.5} className={c.stroke} />
        </g>
      )}
      {stage === 1 && (
        <g>
          <ellipse cx="60" cy="66" rx="30" ry="38" className={c.shell} />
          {/* carita asomándose */}
          <circle cx="60" cy="48" r="17" className={c.body} />
          <circle cx="54" cy="46" r="2.6" className={c.ink} />
          <circle cx="66" cy="46" r="2.6" className={c.ink} />
          <path d="M56 53 L64 53 L60 58 Z" className={c.beak} />
          {/* borde agrietado */}
          <path
            d="M30 60 L38 54 L45 62 L52 54 L60 63 L68 54 L75 62 L82 54 L90 60 L90 70 Q90 104 60 104 Q30 104 30 70 Z"
            className={c.shell}
          />
          <path
            d="M30 60 L38 54 L45 62 L52 54 L60 63 L68 54 L75 62 L82 54 L90 60"
            fill="none"
            strokeWidth={2.5}
            strokeLinejoin="round"
            className={c.stroke}
          />
          <path d="M30 60 Q30 104 60 104 Q90 104 90 60" fill="none" strokeWidth={2.5} className={c.stroke} />
        </g>
      )}
      {stage === 2 && (
        <g>
          <circle cx="60" cy="72" r="30" className={c.body} />
          <ellipse cx="60" cy="80" rx="17" ry="15" className={c.belly} />
          <circle cx="51" cy="62" r="3" className={c.ink} />
          <circle cx="69" cy="62" r="3" className={c.ink} />
          <path d="M55 69 L65 69 L60 75 Z" className={c.beak} />
          <path d="M57 42 Q60 34 63 42" fill="none" strokeWidth={3} strokeLinecap="round" className={c.stroke} />
          <path d="M60 100 L54 106 M60 100 L66 106" strokeWidth={3} strokeLinecap="round" className={c.stroke} />
        </g>
      )}
      {stage === 3 && (
        <g>
          <ellipse cx="60" cy="70" rx="28" ry="34" className={c.body} />
          <ellipse cx="60" cy="80" rx="16" ry="19" className={c.belly} />
          <path d="M32 70 Q20 76 30 88 Q36 82 36 74 Z" className={c.body} />
          <path d="M88 70 Q100 76 90 88 Q84 82 84 74 Z" className={c.body} />
          <circle cx="51" cy="56" r="3.2" className={c.ink} />
          <circle cx="69" cy="56" r="3.2" className={c.ink} />
          <path d="M54 63 L66 63 L60 70 Z" className={c.beak} />
          <path d="M52 37 Q56 28 60 36 Q64 28 68 37" fill="none" strokeWidth={3} strokeLinecap="round" className={c.stroke} />
          <path d="M54 104 L50 109 M66 104 L70 109" strokeWidth={3} strokeLinecap="round" className={c.stroke} />
        </g>
      )}
      {stage === 4 && (
        <g>
          <ellipse cx="60" cy="68" rx="30" ry="38" className={c.body} />
          <ellipse cx="60" cy="78" rx="18" ry="22" className={c.belly} />
          <path d="M30 62 Q12 72 24 94 Q34 86 35 72 Z" className={c.body} />
          <path d="M90 62 Q108 72 96 94 Q86 86 85 72 Z" className={c.body} />
          <circle cx="50" cy="52" r="3.4" className={c.ink} />
          <circle cx="70" cy="52" r="3.4" className={c.ink} />
          <path d="M53 59 L67 59 L60 67 Z" className={c.beak} />
          <path d="M48 32 Q54 20 60 30 Q66 20 72 32" className={c.beak} />
          <path d="M52 105 L48 110 M68 105 L72 110" strokeWidth={3} strokeLinecap="round" className={c.stroke} />
        </g>
      )}
      {stage >= 5 && (
        <g>
          <circle cx="60" cy="62" r="46" className={c.belly} opacity={silhouette ? 0.4 : 0.55} />
          <ellipse cx="60" cy="68" rx="30" ry="38" className={c.body} />
          <ellipse cx="60" cy="78" rx="18" ry="22" className={c.belly} />
          <path d="M30 58 Q4 58 16 92 Q30 88 34 72 Z" className={c.body} />
          <path d="M90 58 Q116 58 104 92 Q90 88 86 72 Z" className={c.body} />
          <path d="M50 52 q3 -4 6 0" fill="none" strokeWidth={3} strokeLinecap="round" className={c.stroke} />
          <path d="M64 52 q3 -4 6 0" fill="none" strokeWidth={3} strokeLinecap="round" className={c.stroke} />
          <path d="M53 59 L67 59 L60 67 Z" className={c.beak} />
          <path d="M44 32 L50 18 L56 28 L60 14 L64 28 L70 18 L76 32 Z" className={c.beak} />
          <path d="M52 105 L48 110 M68 105 L72 110" strokeWidth={3} strokeLinecap="round" className={c.stroke} />
        </g>
      )}
    </svg>
  );
}
