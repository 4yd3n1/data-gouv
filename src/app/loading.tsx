export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        padding: "48px 40px",
        gap: 16,
        flexDirection: "column",
      }}
    >
      {/* Title skeleton */}
      <div className="pulse" style={{ height: 40, width: 360, borderRadius: 4 }} />
      {/* Subtitle skeleton */}
      <div className="pulse" style={{ height: 20, width: 280, borderRadius: 4 }} />
      {/* Content blocks */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16, width: "100%", maxWidth: 680 }}>
        <div className="pulse" style={{ height: 16, width: "100%", borderRadius: 4 }} />
        <div className="pulse" style={{ height: 16, width: "92%", borderRadius: 4 }} />
        <div className="pulse" style={{ height: 16, width: "85%", borderRadius: 4 }} />
      </div>
    </div>
  );
}
