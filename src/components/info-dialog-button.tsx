"use client";

import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";

type InfoDialogButtonProps = {
  bullets?: string[];
  className?: string;
  label: string;
  summary: string;
  title: string;
};

export function InfoDialogButton({
  bullets = [],
  className = "",
  label,
  summary,
  title
}: InfoDialogButtonProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        aria-label={label}
        className={`info-dialog-trigger ${className}`.trim()}
        onClick={() => setOpen(true)}
        type="button"
      >
        <Info size={14} />
      </button>

      {open && (
        <div
          aria-modal="true"
          className="info-dialog-backdrop"
          onClick={() => setOpen(false)}
          role="dialog"
        >
          <article className="info-dialog-card" onClick={(event) => event.stopPropagation()}>
            <header className="info-dialog-header">
              <div>
                <span>Ajuda contextual</span>
                <h2>{title}</h2>
              </div>
              <button aria-label="Fechar explicação" onClick={() => setOpen(false)} type="button">
                <X size={18} />
              </button>
            </header>

            <div className="info-dialog-body">
              <p>{summary}</p>
              {bullets.length > 0 && (
                <div className="info-dialog-points">
                  {bullets.map((bullet) => (
                    <div key={bullet}>
                      <i />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>
        </div>
      )}
    </>
  );
}
