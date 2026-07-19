import type { ZoneSnapshot } from "../../lib/api";

const statusLabel: Record<ZoneSnapshot["status"], string> = {
  comfortable: "Comfortable",
  busy: "Busy",
  critical: "Critical"
};

/**
 * Exposed as a native `<meter>` so assistive tech announces occupancy as a
 * range, not just a color. Status is never color-only: the text tag next to
 * the bar carries the same information the color does.
 */
export function ZoneMeter({ zone }: { zone: ZoneSnapshot }): React.JSX.Element {
  const pct = Math.round(zone.occupancyRate * 100);
  return (
    <li style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
        <span>{zone.label}</span>
        <span className={`status-tag status-tag--${zone.status}`}>
          <span className="status-tag__dot" aria-hidden="true" />
          {statusLabel[zone.status]} · {pct}%
        </span>
      </div>
      <meter
        min={0}
        max={zone.capacity}
        value={zone.occupancy}
        low={zone.capacity * 0.75}
        high={zone.capacity * 0.92}
        optimum={0}
        aria-label={`${zone.label} occupancy: ${pct}%, ${statusLabel[zone.status]}`}
        style={{ width: "100%", height: "0.9rem" }}
      />
    </li>
  );
}
