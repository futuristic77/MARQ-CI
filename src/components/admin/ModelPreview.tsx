import type { CSSProperties, PointerEvent, ReactNode } from "react";

/**
 * Same markup as the Lookbook's model figure (4:7 box, contained image standing on the floor,
 * soft shadow, foot offset), so points placed here land exactly where they appear in the ring.
 */
export function ModelPreview({
  src,
  foot,
  height = 560,
  onPointerDown,
  children,
}: {
  src: string | null | undefined;
  foot: number;
  height?: number;
  onPointerDown?: (e: PointerEvent<HTMLDivElement>) => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-center overflow-hidden border border-dashed border-ink bg-studio px-6 pb-8 pt-6">
      <div className="model__fig" style={{ "--model-h": `${height}px`, "--foot": foot } as CSSProperties}>
        <span className="model__shadow" aria-hidden="true" />
        {src ? <img className="model__pic" src={src} alt="Aperçu du mannequin" draggable={false} /> : <span className="cap absolute inset-0 grid place-items-center text-mute">Aucune image</span>}
        <div className="tags" onPointerDown={onPointerDown} style={{ cursor: onPointerDown ? "crosshair" : undefined, touchAction: "none" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
