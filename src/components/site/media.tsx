import type { CSSProperties } from "react";
import { cutoutOf, cutoutSrcSet, productCrop, productImage, px, type Look, type Product } from "@/data/catalog";

/** Product shot cropped from its 3×3 contact sheet. Parent must be position:relative + overflow hidden. */
export function SheetCell({ product, w = 1200, className = "" }: { product: Pick<Product, "lookN" | "item" | "image" | "images">; w?: number; className?: string }) {
  const photo = productImage(product);
  if (photo) {
    return <img src={photo} alt="" aria-hidden="true" loading="lazy" className={`absolute inset-0 h-full w-full object-contain transition-transform duration-700 ${className}`} />;
  }
  const { sheet, row, col } = productCrop(product);
  return (
    <span
      aria-hidden="true"
      className={`sheet-cell ${className}`}
      style={{ backgroundImage: `url('${px(sheet, w)}')`, backgroundPosition: `${col * 50}% ${row * 50}%` }}
    />
  );
}

/** A model cut-out standing on the studio floor with its soft contact shadow. */
export function ModelFigure({
  look,
  height,
  className = "",
  sizes = "(max-width: 809px) 240px, 360px",
  eager = false,
  children,
}: {
  look: Look;
  height?: number | string;
  className?: string;
  sizes?: string;
  eager?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`model__fig ${className}`}
      style={{ "--foot": look.foot, ...(height ? { "--model-h": typeof height === "number" ? `${height}px` : height } : {}) } as CSSProperties}
    >
      <span className="model__shadow" aria-hidden="true" />
      <img
        className="model__pic"
        src={cutoutOf(look, 914)}
        srcSet={cutoutSrcSet(look)}
        sizes={sizes}
        alt={`Look ${look.n}: ${look.name}`}
        draggable={false}
        decoding="async"
        loading={eager ? "eager" : "lazy"}
      />
      {children}
    </div>
  );
}
