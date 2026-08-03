type Props = {
  headline?: string;
  subheadline?: string;
  cta?: string;
};

/**
 * RTL Hebrew ad copy composited over a clean (text-free) photograph.
 * Sizes use container query units so the overlay scales with the card.
 */
export function AdTextOverlay({ headline, subheadline, cta }: Props) {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(11,25,44,0.92) 0%, rgba(11,25,44,0.72) 30%, rgba(11,25,44,0.15) 58%, rgba(11,25,44,0) 78%)",
        }}
      />
      <div
        dir="rtl"
        className="absolute inset-x-0 bottom-0 flex flex-col items-start text-right"
        style={{ padding: "7cqw", gap: "2.2cqw" }}
      >
        {headline && (
          <h3
            className="text-white m-0"
            style={{
              fontFamily: '"Rubik", "Heebo", sans-serif',
              fontWeight: 900,
              fontSize: "9cqw",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              maxWidth: "92%",
              overflowWrap: "break-word",
              wordBreak: "break-word",
              textShadow: "0 2px 18px rgba(0,0,0,0.35)",
            }}
          >
            {headline}
          </h3>
        )}
        {subheadline && (
          <p
            className="m-0"
            style={{
              fontFamily: '"Heebo", sans-serif',
              color: "rgba(255,255,255,0.86)",
              fontSize: "4.4cqw",
              lineHeight: 1.35,
              fontWeight: 400,
              maxWidth: "88%",
              overflowWrap: "break-word",
              wordBreak: "break-word",
            }}
          >
            {subheadline}
          </p>
        )}
        {cta && (
          <div
            className="inline-flex items-center"
            style={{
              marginTop: "1.6cqw",
              background: "#FFFFFF",
              color: "#0B192C",
              fontFamily: '"Rubik", "Heebo", sans-serif',
              fontWeight: 700,
              fontSize: "4cqw",
              lineHeight: 1,
              padding: "3.4cqw 6cqw",
              borderRadius: "999px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
            }}
          >
            {cta}
          </div>
        )}
      </div>
    </>
  );
}
