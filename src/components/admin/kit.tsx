import { useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ACCEPTED_TYPES, MEDIA_KIND_LABEL, uploadImage, type MediaKind, type MediaRow } from "@/lib/admin/media";

export const inputCls = "w-full border border-dashed border-ink bg-paper px-3 py-2 text-sm outline-none focus:border-solid";
export const btn = "pill !min-h-10 disabled:opacity-40";
export const btnInk = "pill pill--ink !min-h-10 disabled:opacity-40";

export function PageHead({ title, cap, actions }: { title: string; cap?: string; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-dashed border-ink pb-5">
      <div>
        {cap && <p className="cap text-mute">{cap}</p>}
        <h1 className="display mt-1 text-4xl leading-none md:text-5xl">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Field({ label, hint, children, required }: { label: string; hint?: string | undefined; children: ReactNode; required?: boolean | undefined }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="cap">
        {label}
        {required && <span className="text-mute"> *</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-mute">{hint}</span>}
    </label>
  );
}

export function StatusBadge({ status }: { status: "draft" | "published" }) {
  return status === "published" ? (
    <span className="cap rounded-full bg-ink px-2 py-0.5 text-paper">Publié</span>
  ) : (
    <span className="cap rounded-full border border-dashed border-ink px-2 py-0.5">Brouillon</span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="border border-dashed border-ink px-6 py-12 text-center text-sm text-mute">{children}</p>;
}

export function Confirm({
  trigger,
  title,
  description,
  confirmLabel = "Supprimer",
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={() => void onConfirm()}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Upload button with a live progress bar. Calls onUploaded once per imported file. */
export function UploadButton({
  kind,
  multiple = false,
  label = "Importer une image",
  onUploaded,
}: {
  kind: MediaKind;
  multiple?: boolean;
  label?: string;
  onUploaded: (row: MediaRow) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [name, setName] = useState("");

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      setName(file.name);
      setPct(0);
      try {
        const row = await uploadImage(file, kind, setPct);
        onUploaded(row);
        toast.success(`Image importée : ${file.name}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Import impossible.");
      }
    }
    setPct(null);
    if (ref.current) ref.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <input ref={ref} type="file" accept={ACCEPTED_TYPES.join(",")} multiple={multiple} className="sr-only" onChange={(e) => void onFiles(e.target.files)} aria-label={label} />
      <button type="button" className={btn} disabled={pct !== null} onClick={() => ref.current?.click()}>
        {pct === null ? label : `Import… ${pct} %`}
      </button>
      {pct !== null && (
        <div className="flex flex-col gap-1" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Import de ${name}`}>
          <span className="h-1 w-full bg-studio">
            <span className="block h-1 bg-ink transition-[width]" style={{ width: `${pct}%` }} />
          </span>
          <span className="truncate text-xs text-mute">{name}</span>
        </div>
      )}
    </div>
  );
}

export function useMediaLibrary(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "media"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("media").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Choose existing images from the media library. */
export function LibraryPicker({ onPick, multiple = false, label = "Choisir dans la bibliothèque" }: { onPick: (rows: MediaRow[]) => void; multiple?: boolean; label?: string }) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [kind, setKind] = useState<string>("all");
  const { data = [], isLoading } = useMediaLibrary(open);
  const shown = kind === "all" ? data : data.filter((m) => m.kind === kind);
  return (
    <>
      <button type="button" className={btn} onClick={() => { setSel([]); setOpen(true); }}>
        {label}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bibliothèque média</DialogTitle>
          </DialogHeader>
          <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filtrer par type">
            <option value="all">Toutes les images</option>
            {Object.entries(MEDIA_KIND_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {isLoading ? (
            <p className="text-sm text-mute">Chargement…</p>
          ) : shown.length === 0 ? (
            <Empty>Aucune image. Importez-en depuis la Bibliothèque média ou un formulaire.</Empty>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {shown.map((m) => {
                const on = sel.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      if (!multiple) {
                        onPick([m]);
                        setOpen(false);
                        return;
                      }
                      setSel((s) => (on ? s.filter((x) => x !== m.id) : [...s, m.id]));
                    }}
                    className={`relative aspect-square overflow-hidden border bg-studio ${on ? "border-solid border-ink ring-2 ring-ink" : "border-dashed border-ink"}`}
                  >
                    <img src={m.url} alt={m.filename} className="h-full w-full object-contain" loading="lazy" />
                  </button>
                );
              })}
            </div>
          )}
          {multiple && (
            <button
              type="button"
              className={btnInk}
              disabled={!sel.length}
              onClick={() => {
                onPick(sel.map((id) => data.find((m) => m.id === id)!).filter(Boolean));
                setOpen(false);
              }}
            >
              Ajouter {sel.length || ""} image{sel.length > 1 ? "s" : ""}
            </button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** One image: preview + import + choose from library + remove. */
export function ImageField({
  label,
  value,
  onChange,
  kind,
  hint,
  required,
  tall = false,
  onMedia,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  kind: MediaKind;
  hint?: string;
  required?: boolean;
  tall?: boolean;
  onMedia?: (row: MediaRow) => void;
}) {
  const pick = (m: MediaRow) => {
    onChange(m.url);
    onMedia?.(m);
  };
  return (
    <div className="flex flex-col gap-1.5">
      <span className="cap">
        {label}
        {required && <span className="text-mute"> *</span>}
      </span>
      <div className="flex flex-wrap items-start gap-4">
        <div className={`relative flex items-center justify-center overflow-hidden border border-dashed border-ink bg-studio ${tall ? "h-64 w-40" : "h-32 w-32"}`}>
          {value ? <img src={value} alt={label} className="h-full w-full object-contain" /> : <span className="cap text-mute">Aucune</span>}
        </div>
        <div className="flex flex-col gap-2">
          <UploadButton kind={kind} onUploaded={pick} />
          <LibraryPicker onPick={(r) => r[0] && pick(r[0])} />
          {value && (
            <button type="button" className={btn} onClick={() => onChange(null)}>
              Retirer l’image
            </button>
          )}
        </div>
      </div>
      {hint && <span className="text-xs text-mute">{hint}</span>}
    </div>
  );
}

/** Ordered list of images. */
export function GalleryField({ label, value, onChange, kind }: { label: string; value: string[]; onChange: (v: string[]) => void; kind: MediaKind }) {
  const add = (urls: string[]) => onChange([...value, ...urls.filter((u) => !value.includes(u))]);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-1.5">
      <span className="cap">{label}</span>
      {value.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {value.map((u, i) => (
            <li key={u} className="flex flex-col gap-1">
              <span className="relative block aspect-square overflow-hidden border border-dashed border-ink bg-studio">
                <img src={u} alt={`Image ${i + 1}`} className="h-full w-full object-contain" />
              </span>
              <span className="flex justify-between text-xs">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Déplacer avant" className="px-1 disabled:opacity-30">←</button>
                <button type="button" onClick={() => onChange(value.filter((x) => x !== u))} className="underline">Retirer</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Déplacer après" className="px-1 disabled:opacity-30">→</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <UploadButton kind={kind} multiple label="Importer des images" onUploaded={(m) => add([m.url])} />
        <LibraryPicker multiple onPick={(rows) => add(rows.map((r) => r.url))} />
      </div>
    </div>
  );
}

/** Checkbox list for linking content. */
export function CheckList({ label, options, value, onChange }: { label: string; options: { id: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="cap mb-1.5">{label}</legend>
      {options.length === 0 ? (
        <span className="text-xs text-mute">Aucun élément disponible.</span>
      ) : (
        <div className="max-h-48 overflow-y-auto border border-dashed border-ink p-2">
          {options.map((o) => (
            <label key={o.id} className="flex items-center gap-2 py-1 text-sm">
              <input type="checkbox" checked={value.includes(o.id)} onChange={(e) => onChange(e.target.checked ? [...value, o.id] : value.filter((x) => x !== o.id))} />
              {o.label}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

export function TagInput({ label, value, onChange, placeholder, hint }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string; hint?: string }) {
  const [txt, setTxt] = useState(value.join(", "));
  return (
    <Field label={label} hint={hint ?? "Séparez les valeurs par des virgules."}>
      <input
        className={inputCls}
        value={txt}
        placeholder={placeholder}
        onChange={(e) => {
          setTxt(e.target.value);
          onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean));
        }}
      />
    </Field>
  );
}
