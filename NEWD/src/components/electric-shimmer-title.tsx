import { Fragment, type CSSProperties } from "react";

type ElectricShimmerTitleProps = {
  as?: "h1" | "h2";
  className?: string;
  id?: string;
  lines: string[];
};

export function ElectricShimmerTitle({
  as: Tag = "h1",
  className = "",
  id,
  lines,
}: ElectricShimmerTitleProps) {
  let characterIndex = 0;

  return (
    <Tag
      aria-label={lines.join(" ")}
      className={`electric-shimmer-title ${className}`.trim()}
      id={id}
    >
      <span aria-hidden="true">
        {lines.map((line, lineIndex) => (
          <Fragment key={`${line}-${lineIndex}`}>
            <span className="electric-shimmer-line">
              {Array.from(line).map((character) => {
                const index = characterIndex++;
                return (
                  <span
                    className="electric-shimmer-char"
                    key={`${character}-${index}`}
                    style={{ "--shimmer-index": index } as CSSProperties}
                  >
                    {character === " " ? "\u00a0" : character}
                  </span>
                );
              })}
            </span>
            {lineIndex < lines.length - 1 && <br />}
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}
