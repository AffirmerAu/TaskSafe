import Link from "next/link";
import { Icon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="app">
      <div className="scroll" style={{ display: "grid", placeItems: "center", textAlign: "center", padding: 28 }}>
        <div>
          <div style={{ color: "var(--ink-300)", marginBottom: 12 }}>
            <Icon name="lock" size={40} />
          </div>
          <h2>Not available yet</h2>
          <p className="lead" style={{ marginTop: 8 }}>
            This module is locked, or the page doesn&apos;t exist. Finish your current module to
            unlock the next one.
          </p>
          <Link className="btn btn--primary" href="/course" style={{ marginTop: 18 }}>
            Back to course <Icon name="arrow-right" size={18} stroke={2.4} />
          </Link>
        </div>
      </div>
    </div>
  );
}
