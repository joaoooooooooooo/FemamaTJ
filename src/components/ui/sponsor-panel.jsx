import novartisLogo from "@/assets/novartis-logo.png";
import "./sponsor-panel.css";

export function SponsorPanel({ placement = "bottom" }) {
  return (
    <aside className={`sponsor-panel sponsor-panel--${placement}`} aria-label="Patrocinador: Novartis">
      <div className="sponsor-panel__content">
        <span className="sponsor-panel__label">Patrocinador:</span>
        <img className="sponsor-panel__logo" src={novartisLogo} alt="Novartis" />
      </div>
    </aside>
  );
}
