import { Link } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  cutoutOf,
  cutoutSrcSet,
  kindLabel,
  MINUS,
  brandOf,
  defaultSize,
  lookSubtotal,
  money,
  pad,
  productsOfLook,
  sizeAvailable,
  type Look,
} from "@/data/catalog";
import { useBag } from "@/lib/bag";
import { mod, shortest, wrapAngle } from "@/lib/ring";
import { StatusBar } from "@/components/site/StatusBar";
import { QR_PATH } from "./qr";
import { SheetCell } from "@/components/site/media";

const STIFF = 95;
const DAMP = 2 * Math.sqrt(95);

type LineState = { size: string; touched: boolean };
type FocusEl = { key: number; i: number; h: number; closing: boolean };

interface Props {
  looks: Look[];
  /** One or two lines for the serif title in the middle of the ring. */
  title: string[];
  /** Visually hidden page heading. */
  srTitle?: ReactNode;
  subtitle: string;
  drawerCap: string;
  embedded?: boolean;
  initialIndex?: number;
  /** Optional chip shown at the top of the stage (e.g. active filter). */
  filterChip?: ReactNode;
}

interface Engine {
  pos: number;
  goal: number;
  vel: number;
  W: number;
  H: number;
  mobile: boolean;
  modelH: number;
  w: number;
  dragPx: number;
  raf: number;
  last: number;
  visible: boolean;
  dirty: boolean;
  dragging: boolean;
  grid: boolean;
  focusOpen: boolean;
  drawer: boolean;
  autoplay: boolean;
  slipHover: boolean;
  active: number;
  reduced: boolean;
  autoTimer: ReturnType<typeof setTimeout> | undefined;
  animTimer: ReturnType<typeof setTimeout> | undefined;
  dragEnd: number;
  wheelSum: number;
  wheelLock: boolean;
  cacheOp: string[];
  down: null | { x: number; y: number; startGoal: number; id: number; trail: { x: number; t: number }[] };
  animNext: boolean;
  hotScroll: boolean;
  focusKey: number;
  flipped: Set<number>;
  // follow cursor
  fx: number;
  fy: number;
  tx: number;
  ty: number;
  fOn: boolean;
  fRaf: number;
}

interface Api {
  next: () => void;
  prev: () => void;
  jumpTo: (i: number) => void;
  stopAuto: () => void;
  setAutoplay: (on: boolean) => void;
  setGrid: (on: boolean) => void;
  openFocus: () => void;
  closeFocus: () => void;
  setDrawer: (open: boolean) => void;
  setHot: (p: number, scroll?: boolean) => void;
}

export function RingLookbook({ looks, title = ["Dans le", "cercle"], srTitle, subtitle = "Vol. 01 — Neuf looks", drawerCap = "Looks · Vol. 01", embedded = false, initialIndex = 0, filterChip }: Props) {
  const N = looks.length;
  const start = mod(initialIndex, N);
  const bag = useBag();

  const [active, setActiveState] = useState(start);
  const [autoplay, setAutoplayState] = useState(N > 1);
  const [grid, setGridState] = useState(false);
  const [drawer, setDrawerState] = useState(false);
  const [focusEls, setFocusEls] = useState<FocusEl[]>([]);
  const [hot, setHotState] = useState(0);
  const [picking, setPicking] = useState<number[]>([]);
  const [msg, setMsg] = useState("");
  const [lineState, setLineState] = useState<Record<string, LineState[]>>({});
  const [hasFollow, setHasFollow] = useState(false);

  const deckRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const followRef = useRef<HTMLSpanElement>(null);
  const liveRef = useRef<HTMLSpanElement>(null);
  const nowRef = useRef<HTMLDivElement>(null);
  const piecesRef = useRef<HTMLUListElement>(null);
  const focusStageRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const slipRef = useRef<HTMLElement>(null);
  const linesRef = useRef<HTMLUListElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerBtnRef = useRef<HTMLButtonElement>(null);
  const bodies = useRef<(HTMLDivElement | null)[]>([]);
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const drawerItems = useRef<(HTMLButtonElement | null)[]>([]);
  const focusNodes = useRef(new Map<number, HTMLDivElement>());
  const apiRef = useRef<Api | null>(null);
  const looksRef = useRef(looks);
  looksRef.current = looks;

  const E = useRef<Engine>(null as unknown as Engine);
  if (!E.current) {
    E.current = {
      pos: start - 1.15, goal: start, vel: 0, W: 0, H: 0, mobile: false, modelH: 560, w: 320, dragPx: 120,
      raf: 0, last: 0, visible: true, dirty: true, dragging: false, grid: false, focusOpen: false, drawer: false,
      autoplay: N > 1, slipHover: false, active: start, reduced: false, autoTimer: undefined, animTimer: undefined,
      dragEnd: 0, wheelSum: 0, wheelLock: false, cacheOp: [], down: null, animNext: false, hotScroll: false,
      focusKey: 0, flipped: new Set(), fx: 0, fy: 0, tx: 0, ty: 0, fOn: false, fRaf: 0,
    };
  }

  // ---------------- engine ----------------
  useEffect(() => {
    const e = E.current;
    const deck = deckRef.current!;
    const stage = stageRef.current!;
    const ring = ringRef.current!;
    const STEP = (Math.PI * 2) / N;
    e.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (e.reduced) {
      e.pos = e.goal;
      e.autoplay = false;
    }
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    setHasFollow(fine);
    if (fine) deck.classList.add("has-follow");

    const fig = (i: number) => bodies.current[i]?.querySelector(".model__fig") as HTMLElement | null;

    // ---- measurement ----
    const pads = () => ({ top: 136, bottom: e.mobile ? 168 : 120 });
    function measure() {
      e.W = stage.clientWidth;
      e.H = stage.clientHeight;
      e.mobile = innerWidth < 810;
      const { top, bottom } = pads();
      e.modelH = Math.max(200, Math.round((e.H - bottom - 18 - top) / 1.12));
      stage.style.setProperty("--model-h", e.modelH + "px");
      e.w = (e.modelH * 4) / 7;
      e.dragPx = Math.max(e.mobile ? 90 : 120, e.W * 0.3);
      if (e.grid) layoutGrid();
      e.dirty = true;
      kick();
    }

    function place(i: number, x: number, y: number, s: number, op: number, blur: number, z: number) {
      const b = bodies.current[i];
      if (!b) return;
      const ws = e.w * s;
      if (x + ws / 2 < -4 || x - ws / 2 > e.W + 4) op = 0;
      b.style.transform = `translate3d(${x.toFixed(1)}px, ${(y - e.H).toFixed(1)}px, 0) translateX(-50%) scale(${s.toFixed(4)})`;
      const o = op.toFixed(3);
      if (e.cacheOp[i] !== o) {
        e.cacheOp[i] = o;
        b.style.opacity = o;
        b.style.visibility = op < 0.01 ? "hidden" : "";
        b.style.pointerEvents = op < 0.5 ? "none" : "";
      }
      b.style.filter = blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : "";
      b.style.zIndex = String(z);
    }

    function layoutRing() {
      const { W, H, mobile, modelH, pos } = e;
      const { top, bottom } = pads();
      const cx = W * 0.5;
      const inner = H - top - bottom;
      const cy = top + inner * 0.5 + 6;
      const ry = inner * (mobile ? 0.34 : 0.37);
      const rx = Math.min(W * (mobile ? 0.3 : 0.28), ry * (mobile ? 1.15 : 1.7));
      const frontH = H * (mobile ? 0.19 : 0.255);
      const front = frontH / modelH;
      stage.style.setProperty("--loop-y", cy - frontH * 0.5 - 6 + "px");
      stage.style.setProperty("--ring-y", cy + "px");
      ring.style.width = 2 * rx + "px";
      ring.style.height = 2 * ry + "px";
      for (let i = 0; i < N; i++) {
        const a = wrapAngle((i - pos) * STEP);
        const depth = (1 + Math.cos(a)) / 2;
        const dist = Math.abs(a) / STEP;
        const near = Math.min(1, Math.max(0, 1 - dist));
        const s = front * (0.5 + 0.5 * depth) * (1 + 0.14 * near);
        const x = cx + rx * Math.sin(a);
        const y = cy + ry * Math.cos(a) + modelH * s * 0.08;
        const blur = Math.max(0, (1 - depth) * 2.2 - 0.3);
        place(i, x, y, s, 1, blur, Math.round(depth * 1000) + 10);
      }
    }

    function layoutGrid() {
      const { W, H, mobile, modelH } = e;
      const cols = Math.min(3, N);
      const rows = Math.ceil(N / cols);
      const top = mobile ? 72 : 80;
      const rowH = (H - (mobile ? 104 : 96) - top) / Math.max(rows, embedded ? 2 : 3);
      const colW = W / cols;
      const s = Math.min(rowH - 40, ((colW * 7) / 4) * 0.92) / modelH;
      const used = rowH * rows;
      const offY = (H - (mobile ? 104 : 96) - top - used) / 2;
      for (let i = 0; i < N; i++) {
        const r = Math.floor(i / cols);
        const inRow = Math.min(cols, N - r * cols);
        const off = ((cols - inRow) * colW) / 2;
        const x = off + colW * ((i % cols) + 0.5);
        const y = top + offY + rowH * (r + 1) - 32;
        place(i, x, y, s, 1, 0, 10 + r);
        const lb = labels.current[i];
        if (lb) lb.style.transform = `translate3d(${x.toFixed(1)}px, ${(y + 12).toFixed(1)}px, 0) translateX(-50%)`;
      }
    }

    // ---- loop ----
    function tick(t: number) {
      e.raf = 0;
      const dt = e.last ? Math.min(0.034, (t - e.last) / 1000) : 1 / 60;
      e.last = t;
      if (e.reduced) {
        e.pos = e.goal;
        e.vel = 0;
      } else {
        const h = dt / 3;
        for (let k = 0; k < 3; k++) {
          const acc = -STIFF * (e.pos - e.goal) - DAMP * e.vel;
          e.vel += acc * h;
          e.pos += e.vel * h;
        }
      }
      let moving = true;
      if (Math.abs(e.pos - e.goal) <= 5e-4 && Math.abs(e.vel) <= 5e-4) {
        e.pos = e.goal;
        e.vel = 0;
        moving = false;
      }
      if ((moving || e.dirty || e.dragging) && !e.grid) layoutRing();
      e.dirty = false;
      deck.classList.toggle("is-moving", moving || e.dragging);
      if (moving || e.dragging) e.raf = requestAnimationFrame(tick);
      else e.last = 0;
    }
    function kick() {
      if (!e.raf && e.visible) e.raf = requestAnimationFrame(tick);
    }

    // ---- active / navigation ----
    function restart(el: Element | null, cls: string) {
      if (!el) return;
      el.classList.remove(cls);
      void (el as HTMLElement).offsetWidth;
      el.classList.add(cls);
    }
    function setActive(i: number, quiet = false) {
      i = mod(i, N);
      if (i === e.active) return;
      e.active = i;
      setActiveState(i);
      if (!quiet) {
        const L = looksRef.current[i]!;
        if (liveRef.current) liveRef.current.textContent = `Look ${L.n}: ${L.name}`;
        if (!e.reduced) {
          restart(stage, "is-glint");
          e.animNext = true;
        }
        if (e.focusOpen) closeFocus();
      }
      setPicking([]);
      setMsg("");
      scheduleAuto();
    }
    function goTo(g: number) {
      e.goal = g;
      setActive(mod(g, N));
      kick();
    }
    const next = () => goTo(Math.round(e.goal) + 1);
    const prev = () => goTo(Math.round(e.goal) - 1);
    const jumpTo = (i: number) => goTo(Math.round(e.goal) + shortest(i, e.active, N));

    function scheduleAuto() {
      clearTimeout(e.autoTimer);
      if (!e.autoplay) return;
      e.autoTimer = setTimeout(() => {
        if (e.visible && !e.dragging && !document.hidden && !e.slipHover && !e.focusOpen && !e.grid && !e.drawer) next();
        scheduleAuto();
      }, 5000);
    }
    function setAutoplay(on: boolean) {
      e.autoplay = on;
      deck.classList.toggle("is-playing", on);
      setAutoplayState(on);
      scheduleAuto();
    }
    function stopAuto() {
      if (e.autoplay) setAutoplay(false);
    }

    // ---- grid ----
    function setGrid(on: boolean) {
      if (on === e.grid || e.focusOpen) return;
      stopAuto();
      bodies.current.forEach((b, i) => {
        if (!b) return;
        const k = Math.round((Math.abs(wrapAngle((i - e.pos) * STEP)) / Math.PI) * 4);
        b.style.setProperty("--d", k * (on ? 0.32 : 0.24) + "s");
      });
      deck.classList.add("is-anim");
      clearTimeout(e.animTimer);
      e.animTimer = setTimeout(() => deck.classList.remove("is-anim"), e.reduced ? 0 : 1700);
      e.grid = on;
      deck.classList.toggle("is-grid", on);
      setGridState(on);
      stage.setAttribute("aria-roledescription", on ? "grille de looks" : "carrousel");
      if (on) layoutGrid();
      else {
        e.cacheOp = [];
        e.dirty = true;
        layoutRing();
      }
    }

    // ---- focus ----
    function openFocus() {
      if (e.focusOpen) return;
      stopAuto();
      setHot(0);
      if (e.drawer) setDrawer(false);
      const i = mod(Math.round(e.goal), N);
      const r = focusStageRef.current!.getBoundingClientRect();
      const h = Math.max(160, Math.min(r.height, r.width / (4 / 7)));
      e.focusOpen = true;
      deck.classList.add("is-focus");
      const key = ++e.focusKey;
      setFocusEls((cur) => [...cur, { key, i, h, closing: false }]);
    }
    function closeFocus() {
      if (!e.focusOpen) return;
      const node = focusNodes.current.get(e.focusKey);
      if (node && !e.reduced) {
        const src = fig(mod(Math.round(e.goal), N))?.getBoundingClientRect();
        const dst = node.getBoundingClientRect();
        if (src && dst.height) {
          node.style.transform = `translate3d(${src.left - dst.left}px, ${src.bottom - dst.bottom}px, 0) scale(${src.height / dst.height})`;
        }
      }
      e.focusOpen = false;
      deck.classList.remove("is-focus");
      setHot(0);
      const key = e.focusKey;
      setFocusEls((cur) => cur.map((f) => (f.key === key ? { ...f, closing: true } : f)));
      setTimeout(() => setFocusEls((cur) => cur.filter((f) => f.key !== key)), e.reduced ? 0 : 950);
      const ae = document.activeElement;
      if (ae && (focusStageRef.current?.parentElement?.contains(ae) || slipRef.current?.contains(ae))) {
        stage.focus({ preventScroll: true });
      }
    }

    // ---- drawer ----
    function setDrawer(open: boolean) {
      if (open === e.drawer) return;
      e.drawer = open;
      deck.classList.toggle("is-drawer", open);
      setDrawerState(open);
      if (open) {
        stopAuto();
        if (e.focusOpen) closeFocus();
        requestAnimationFrame(() => drawerItems.current[e.active]?.focus({ preventScroll: true }));
      } else if (drawerRef.current?.contains(document.activeElement)) {
        drawerBtnRef.current?.focus({ preventScroll: true });
      }
    }

    function setHot(p: number, scroll = false) {
      e.hotScroll = scroll;
      setHotState(p);
    }

    apiRef.current = { next, prev, jumpTo, stopAuto, setAutoplay, setGrid, openFocus, closeFocus, setDrawer, setHot };

    // ---- follow cursor ----
    const follow = followRef.current;
    function followState(target: EventTarget | null) {
      if (!follow) return;
      const el = target as Element | null;
      const hit = el?.closest?.(".model__hit") as HTMLElement | null;
      const isView = !!hit && !e.dragging && !e.focusOpen && (e.grid || Number(hit.dataset["i"]) === mod(Math.round(e.goal), N));
      const isLink = !!hit && !e.dragging && !e.focusOpen && !isView && !e.grid;
      const isPin = e.focusOpen && !!el?.closest?.(".tag, .focus__close");
      follow.classList.toggle("is-view", isView);
      follow.classList.toggle("is-link", isLink);
      follow.classList.toggle("is-pin", isPin);
    }
    function followTick() {
      e.fRaf = 0;
      if (!follow) return;
      const k = e.reduced ? 1 : 0.18;
      e.fx += (e.tx - e.fx) * k;
      e.fy += (e.ty - e.fy) * k;
      follow.style.transform = `translate3d(${e.fx.toFixed(1)}px, ${e.fy.toFixed(1)}px, 0)`;
      if (Math.hypot(e.tx - e.fx, e.ty - e.fy) >= 0.4) e.fRaf = requestAnimationFrame(followTick);
    }
    function followMove(ev: PointerEvent) {
      if (!fine || !follow || ev.pointerType !== "mouse") return;
      const r = stage.getBoundingClientRect();
      e.tx = ev.clientX - r.left;
      e.ty = ev.clientY - r.top;
      if (!e.fOn) {
        e.fx = e.tx;
        e.fy = e.ty;
        e.fOn = true;
        follow.classList.add("is-on");
      }
      followState(ev.target);
      if (!e.fRaf) e.fRaf = requestAnimationFrame(followTick);
    }
    function followLeave() {
      if (!follow) return;
      e.fOn = false;
      follow.classList.remove("is-on", "is-view", "is-link");
    }

    // ---- drag ----
    function onDown(ev: PointerEvent) {
      if (e.focusOpen || e.grid || (ev.pointerType === "mouse" && ev.button !== 0)) return;
      e.down = { x: ev.clientX, y: ev.clientY, startGoal: e.goal, id: ev.pointerId, trail: [{ x: ev.clientX, t: performance.now() }] };
    }
    function onMove(ev: PointerEvent) {
      followMove(ev);
      const d = e.down;
      if (!d || ev.pointerId !== d.id) return;
      if (ev.pointerType === "mouse" && !(ev.buttons & 1)) {
        release(ev);
        return;
      }
      const dx = ev.clientX - d.x;
      const dy = ev.clientY - d.y;
      if (!e.dragging) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
          e.down = null;
          return;
        }
        if (Math.abs(dx) > 8 && Math.abs(dx) > 1.2 * Math.abs(dy)) {
          e.dragging = true;
          deck.classList.add("is-dragging");
          try {
            stage.setPointerCapture(d.id);
          } catch {
            /* noop */
          }
          stopAuto();
          followState(ev.target);
        } else return;
      }
      d.trail.push({ x: ev.clientX, t: performance.now() });
      if (d.trail.length > 6) d.trail.shift();
      e.goal = d.startGoal - dx / e.dragPx;
      setActive(mod(Math.round(e.goal), N));
      kick();
    }
    function release(ev: PointerEvent) {
      const d = e.down;
      if (!d || ev.pointerId !== d.id) return;
      e.down = null;
      if (!e.dragging) return;
      e.dragging = false;
      deck.classList.remove("is-dragging");
      const first = d.trail[0]!;
      const last = d.trail[d.trail.length - 1]!;
      const v = (last.x - first.x) / (last.t - first.t || 1);
      const base = Math.round(d.startGoal);
      const dx = ev.clientX - d.x;
      let target: number;
      if (e.mobile) {
        target = Math.abs(dx) > 30 || Math.abs(v) > 0.3 ? base + (dx < 0 ? 1 : -1) : base;
      } else {
        target = Math.round(e.goal - (v * 160) / e.dragPx);
        if (target === base && Math.abs(v) > 0.3) target = base + (v < 0 ? 1 : -1);
        target = Math.max(base - 2, Math.min(base + 2, target));
      }
      goTo(target);
      e.dragEnd = performance.now();
      followState(ev.target);
    }
    function onClick(ev: MouseEvent) {
      if (performance.now() - e.dragEnd < 60) return;
      const hit = (ev.target as Element).closest?.(".model__hit") as HTMLElement | null;
      if (!hit) return;
      const i = Number(hit.dataset["i"]);
      if (e.grid) {
        e.goal = e.pos = i;
        e.vel = 0;
        setActive(i);
        openFocus();
      } else {
        const d = shortest(i, Math.round(e.goal), N);
        if (d === 0) openFocus();
        else {
          stopAuto();
          goTo(Math.round(e.goal) + d);
        }
      }
    }
    function onWheel(ev: WheelEvent) {
      if (Math.abs(ev.deltaX) <= Math.abs(ev.deltaY) || e.focusOpen || e.grid) return;
      ev.preventDefault();
      if (e.wheelLock) return;
      e.wheelSum += ev.deltaX;
      if (Math.abs(e.wheelSum) > 45) {
        stopAuto();
        if (e.wheelSum > 0) next();
        else prev();
        e.wheelSum = 0;
        e.wheelLock = true;
        setTimeout(() => (e.wheelLock = false), 520);
      }
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.target !== stage) return;
      if (ev.key === "ArrowRight") {
        ev.preventDefault();
        stopAuto();
        next();
      } else if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        stopAuto();
        prev();
      } else if (e.grid && (ev.key === "ArrowDown" || ev.key === "ArrowUp")) {
        ev.preventDefault();
        jumpTo(e.active + (ev.key === "ArrowDown" ? 3 : -3));
      } else if (ev.key === "Enter" && !e.focusOpen) {
        ev.preventDefault();
        if (e.grid) {
          e.goal = e.pos = e.active;
          e.vel = 0;
        }
        openFocus();
      }
    }
    function onEsc(ev: KeyboardEvent) {
      if (ev.key !== "Escape") return;
      if (e.focusOpen) closeFocus();
      else if (e.drawer) setDrawer(false);
    }
    function onVis() {
      if (!document.hidden) {
        kick();
        scheduleAuto();
      }
    }

    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", release);
    stage.addEventListener("pointercancel", release);
    stage.addEventListener("pointerleave", followLeave);
    stage.addEventListener("click", onClick);
    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("keydown", onKey);
    const fstage = focusStageRef.current!;
    fstage.addEventListener("pointermove", followMove);
    document.addEventListener("keydown", onEsc);
    document.addEventListener("visibilitychange", onVis);

    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    const io = new IntersectionObserver((entries) => {
      e.visible = entries[entries.length - 1]?.isIntersecting ?? false;
      if (e.visible) kick();
    });
    io.observe(stage);

    measure();
    setAutoplay(e.autoplay);
    kick();

    return () => {
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", release);
      stage.removeEventListener("pointercancel", release);
      stage.removeEventListener("pointerleave", followLeave);
      stage.removeEventListener("click", onClick);
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("keydown", onKey);
      fstage.removeEventListener("pointermove", followMove);
      document.removeEventListener("keydown", onEsc);
      document.removeEventListener("visibilitychange", onVis);
      ro.disconnect();
      io.disconnect();
      cancelAnimationFrame(e.raf);
      cancelAnimationFrame(e.fRaf);
      e.raf = 0;
      e.fRaf = 0;
      clearTimeout(e.autoTimer);
      clearTimeout(e.animTimer);
      apiRef.current = null;
    };
    // The engine is created once per mount; parents remount via `key` when the look set changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // restart dock name + pieces animations after a non-quiet look change
  useLayoutEffect(() => {
    const e = E.current;
    if (!e.animNext) return;
    e.animNext = false;
    for (const [el, cls] of [[nowRef.current, "is-swap"], [piecesRef.current, "is-in"]] as const) {
      if (!el) continue;
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
    }
  }, [active]);

  // FLIP: newly opened focus figure grows out of the ring figure
  useLayoutEffect(() => {
    const e = E.current;
    const fresh = focusEls.find((f) => !f.closing && !e.flipped.has(f.key));
    if (!fresh) return;
    e.flipped.add(fresh.key);
    const node = focusNodes.current.get(fresh.key);
    const srcFig = bodies.current[fresh.i]?.querySelector(".model__fig");
    if (node && srcFig && !e.reduced) {
      const src = srcFig.getBoundingClientRect();
      const dst = node.getBoundingClientRect();
      if (dst.height) {
        node.style.transition = "none";
        node.style.transform = `translate3d(${src.left - dst.left}px, ${src.bottom - dst.bottom}px, 0) scale(${src.height / dst.height})`;
        void node.offsetWidth;
        node.style.transition = "";
        node.style.transform = "";
      }
    }
    closeRef.current?.focus({ preventScroll: true });
  }, [focusEls]);

  // hot dot: fit its tooltip inside the stage and scroll the receipt line into view
  useLayoutEffect(() => {
    const e = E.current;
    const node = focusNodes.current.get(e.focusKey);
    const fstage = focusStageRef.current;
    if (!hot || !node || !fstage) return;
    const tag = node.querySelector(`.tag[data-p="${hot}"]`) as HTMLElement | null;
    const tip = tag?.querySelector(".tag__tip") as HTMLElement | null;
    if (tag && tip) {
      tag.classList.remove("is-flip", "is-below");
      tag.style.removeProperty("--dx");
      const t = tag.getBoundingClientRect();
      const s = fstage.getBoundingClientRect();
      const tw = tip.offsetWidth;
      if (t.right + tw <= s.right - 8) {
        /* keep right */
      } else if (t.left - tw >= s.left + 8) tag.classList.add("is-flip");
      else {
        tag.classList.add("is-below");
        const half = Math.min(tw, s.width - 16) / 2;
        const c = t.left + t.width / 2;
        const clamped = Math.max(s.left + 8 + half, Math.min(s.right - 8 - half, c));
        tag.style.setProperty("--dx", `${(clamped - c).toFixed(1)}px`);
      }
    }
    if (e.hotScroll) {
      const line = linesRef.current?.querySelector(`.line[data-p="${hot}"]`);
      line?.scrollIntoView({ block: "nearest", behavior: e.reduced ? "auto" : "smooth" });
    }
  }, [hot]);

  // ---------------- derived ----------------
  const look = looks[active]!;
  const products = productsOfLook(look);
  const ls: LineState[] =
    lineState[look.slug] ?? products.map((p) => ({ size: defaultSize(p.sizes), touched: p.sizes.length === 1 }));
  const added = products.map((p) => bag.has(p.slug));
  const complete = added.every(Boolean);
  const sub = lookSubtotal(look);
  const latestFocus = [...focusEls].reverse().find((f) => !f.closing) ?? focusEls[focusEls.length - 1];
  const focusLook = looks[latestFocus?.i ?? active]!;
  const api = () => apiRef.current;

  const updateLine = (k: number, patch: Partial<LineState>) =>
    setLineState((cur) => {
      const base = cur[look.slug] ?? ls;
      return { ...cur, [look.slug]: base.map((s, j) => (j === k ? { ...s, ...patch } : s)) };
    });

  function addToBag(ks: number[]) {
    if (!ks.length) return;
    bag.add(
      ks.map((k) => ({ productSlug: products[k]!.slug, size: ls[k]!.size, lookSlug: look.slug })),
      ks.length > 1 ? "Look ajouté au panier." : "Article ajouté au panier.",
    );
    setPicking((cur) => cur.filter((p) => !ks.includes(p)));
  }

  function onCta() {
    if (complete) return;
    api()?.stopAuto();
    const missing = products.map((_, k) => k).filter((k) => !added[k]);
    const touched = missing.filter((k) => ls[k]!.touched);
    const untouched = missing.filter((k) => !ls[k]!.touched);
    addToBag(touched);
    if (untouched.length) {
      const mobile = typeof window !== "undefined" && window.innerWidth < 810;
      setPicking(mobile ? [untouched[0]!] : untouched);
      setMsg(`Choisir une taille pour : ${untouched.map((k) => products[k]!.name).join(", ")}`);
    } else setMsg("");
  }

  const modelImg = (L: Look, first = false) => (
    <img
      className="model__pic"
      src={cutoutOf(L, 914)}
      srcSet={cutoutSrcSet(L)}
      sizes="(max-width: 809px) 240px, 360px"
      alt={L.name}
      draggable={false}
      decoding="async"
      {...(first ? { fetchPriority: "high" as const } : {})}
    />
  );

  return (
    <section
      className={`deck${embedded ? " deck--embedded" : ""}`}
      ref={deckRef}
      aria-labelledby="deck-title"
    >
      <div className="deck__intro">
        <h1 id="deck-title">{srTitle ?? title.join(" ")}</h1>
        <p>
          <span>{subtitle}.</span> <span>Faites tourner le cercle, choisissez un look, touchez un point pour découvrir le vêtement.</span>
        </p>
      </div>

      {!embedded && <StatusBar variant="deck" />}

      <div
        className="deck__stage"
        id="stage"
        ref={stageRef}
        tabIndex={0}
        role="region"
        aria-roledescription="carrousel"
        aria-label="Looks — les flèches font tourner le cercle, Entrée ouvre le look"
      >
        <span className="loop__ring" ref={ringRef} aria-hidden="true" />
        <div className="loop" aria-hidden="true">
          <p className="loop__t">
            {title.map((t, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {t}
              </span>
            ))}
          </p>
          <p className="loop__s">{subtitle}</p>
        </div>
        <div className="deck__crowd">
          {looks.map((L, i) => (
            <div
              key={L.slug}
              className="model"
              ref={(el) => {
                bodies.current[i] = el;
              }}
              style={{ "--foot": L.foot } as CSSProperties}
            >
              <div className="model__fig">
                <span className="model__shadow" aria-hidden="true" />
                {modelImg(L, i === start)}
                <button
                  type="button"
                  className="model__hit"
                  tabIndex={i === active ? 0 : -1}
                  data-i={i}
                  aria-label={`Look ${pad(L.n)}: ${L.name}`}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="deck__labels" aria-hidden="true">
          {looks.map((L, i) => (
            <span
              key={L.slug}
              className={`deck__label cap${i === active ? " is-on" : ""}`}
              style={{ "--i": i } as CSSProperties}
              ref={(el) => {
                labels.current[i] = el;
              }}
            >
              {pad(L.n)}
              {"\u00a0\u00a0"}
              {L.name}
            </span>
          ))}
        </div>
        <span className="deck__glint" aria-hidden="true" />
        {hasFollow && (
          <span className="follow" id="follow" ref={followRef} aria-hidden="true">
            <span className="follow__in">
              <b className="f-drag">Glisser</b>
              <b className="f-view">Voir</b>
            </span>
          </span>
        )}
        <span className="deck__live" ref={liveRef} aria-live="polite" />
      </div>

      {filterChip && <div className="deck__filter">{filterChip}</div>}

      <div className="dock">
        <div className="dock__now" id="now" ref={nowRef}>
          <div className="dock__count">
            <span className="cap">
              <span id="nowIdx">{pad(active + 1)}</span> / <span id="nowTotal">{pad(N)}</span>
            </span>
            <button
              type="button"
              className="dock__auto"
              aria-label="Lecture automatique"
              aria-pressed={autoplay}
              onClick={() => api()?.setAutoplay(!autoplay)}
            >
              <svg className="i-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M6.5 4.5h3.5v15H6.5z" />
                <path d="M14 4.5h3.5v15H14z" />
              </svg>
              <svg className="i-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7 4.5v15l12.5-7.5z" />
              </svg>
            </button>
          </div>
          <div className="dock__name" id="nowName">
            {look.name}
          </div>
        </div>
        <ul className="dock__pieces" id="pieces" ref={piecesRef} aria-label="Articles de ce look">
          {products.map((p, k) => {
            return (
              <li key={p.slug} style={{ "--i": k + 1 } as CSSProperties}>
                <button
                  type="button"
                  className="piece"
                  data-p={k + 1}
                  aria-label={`${p.name}, ${money(p.price)}`}
                  onClick={() => {
                    api()?.openFocus();
                    api()?.setHot(k + 1, true);
                  }}
                >
                  <span className="piece__img">
                    <SheetCell product={p} w={600} />
                  </span>
                  <span className="piece__txt">
                    <span className="piece__name">{p.name}</span>
                    <i className="piece__price">{money(p.price)}</i>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <button type="button" className="dock__shop" id="shop" aria-label="Acheter ce look" onClick={() => api()?.openFocus()}>
          <span className="cap">Acheter le look</span>
          <span className="dock__dot">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 4v16M4 12h16" />
            </svg>
          </span>
        </button>
      </div>

      <Link to="/" className="deck__qr" aria-label="Accueil MARQ’CI">
        <svg id="qr" viewBox="0 0 25 25" shapeRendering="crispEdges" aria-hidden="true">
          <path fill="currentColor" d={QR_PATH} />
        </svg>
      </Link>

      <button
        type="button"
        className="deck__looksbtn pill"
        id="drawerBtn"
        ref={drawerBtnRef}
        aria-expanded={drawer}
        aria-controls="drawer"
        onClick={() => api()?.setDrawer(!drawer)}
      >
        Looks
      </button>

      <div className="deck__view" role="group" aria-label="Affichage">
        {(["ring", "grid"] as const).map((v) => (
          <button
            key={v}
            type="button"
            className="deck__vbtn"
            data-v={v}
            aria-pressed={v === "grid" ? grid : !grid}
            onClick={() => api()?.setGrid(v === "grid")}
          >
            {v === "ring" ? "Cercle" : "Grille"}
          </button>
        ))}
      </div>

      {/* Looks drawer */}
      <div className="drawer" id="drawer" ref={drawerRef} aria-hidden={!drawer}>
        <div className="drawer__top">
          <span className="cap">{drawerCap}</span>
          <button type="button" className="pill" onClick={() => api()?.setDrawer(false)}>
            Fermer
          </button>
        </div>
        <ol className="drawer__list" id="drawerList">
          {looks.map((L, i) => (
            <li key={L.slug} style={{ "--i": i } as CSSProperties}>
              <button
                type="button"
                className="drawer__item"
                data-i={i}
                aria-current={i === active ? "true" : "false"}
                ref={(el) => {
                  drawerItems.current[i] = el;
                }}
                onClick={() => {
                  api()?.jumpTo(i);
                  api()?.setDrawer(false);
                }}
              >
                <span className="cap">{pad(L.n)}</span>
                <span className="drawer__name">{L.name}</span>
                <span className="drawer__meta cap">
                  {productsOfLook(L).length} pièces · {money(lookSubtotal(L))}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <nav className="drawer__nav" aria-label="Plateforme">
          <Link to="/lookbook" className="pill">Vol. 01</Link>
          <Link to="/looks" className="pill">Tous les looks</Link>
          <Link to="/brands" className="pill">Marques</Link>
          <Link to="/collections" className="pill">Collections</Link>
          <Link to="/categories" className="pill">Boutique</Link>
        </nav>
      </div>

      {/* Focus view */}
      <div className="focus" id="focus" aria-hidden={!latestFocus || latestFocus.closing}>
        <div className="focus__top">
          <p className="focus__cap">
            <span id="focusNum">{pad(focusLook.n)}.</span>
            <i id="focusName">{focusLook.name}</i>
          </p>
          <div className="focus__acts">
            <Link to="/looks/$lookSlug" params={{ lookSlug: focusLook.slug }} className="pill">
              Voir le look
            </Link>
            <button
              type="button"
              className="focus__close"
              id="focusClose"
              ref={closeRef}
              aria-label="Fermer le look"
              onClick={() => api()?.closeFocus()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                <path d="M5 5l14 14M19 5L5 19" />
              </svg>
            </button>
          </div>
        </div>
        <div
          className="focus__stage"
          id="focusStage"
          ref={focusStageRef}
          onClick={(ev) => {
            const t = ev.target as Element;
            if (t.closest(".tag")) return;
            if (!t.closest(".model__fig")) api()?.closeFocus();
          }}
        >
          {focusEls.map((f) => {
            const L = looks[f.i]!;
            const prods = productsOfLook(L);
            return (
              <div
                key={f.key}
                className={`focus__model${f.closing ? " is-closing" : ""}`}
                style={{ "--model-h": `${f.h}px`, "--foot": L.foot } as CSSProperties}
                ref={(el) => {
                  if (el) focusNodes.current.set(f.key, el);
                  else focusNodes.current.delete(f.key);
                }}
              >
                <div className="model__fig">
                  <span className="model__shadow" aria-hidden="true" />
                  {modelImg(L)}
                  <div className="tags">
                    {L.tags.map(([x, y], k) => {
                      const p = prods[k]!;
                      return (
                        <button
                          key={k}
                          type="button"
                          className={`tag${hot === k + 1 && !f.closing ? " is-hot" : ""}`}
                          data-p={k + 1}
                          style={{ left: `${x}%`, top: `${y}%`, "--pi": k + 1 } as CSSProperties}
                          aria-label={`${pad(k + 1)}: ${p.name}, ${money(p.price)}`}
                          onPointerOver={(ev) => ev.pointerType === "mouse" && api()?.setHot(k + 1)}
                          onFocus={() => api()?.setHot(k + 1)}
                          onClick={() => api()?.setHot(k + 1, true)}
                        >
                          <span className="dotnum">{pad(k + 1)}</span>
                          <span className="tag__tip">
                            <b>{p.name}</b>
                            <span>{money(p.price)}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="focus__hint cap">Touchez un point pour découvrir le vêtement</p>
      </div>

      {/* Receipt slip */}
      <aside
        className={`slip${complete ? " is-complete" : ""}`}
        id="slip"
        ref={slipRef}
        aria-label="Dans ce look"
        aria-hidden={!latestFocus || latestFocus.closing}
        onPointerEnter={(ev) => {
          if (ev.pointerType === "mouse") E.current.slipHover = true;
        }}
        onPointerLeave={(ev) => {
          if (ev.pointerType === "mouse") E.current.slipHover = false;
        }}
      >
        <div className="slip__head">
          <div className="slip__logo">
            MARQ’CI
          </div>
          <span className="cap">Vol. 01 · Ticket 0004 · Abidjan</span>
          <Link to="/looks/$lookSlug" params={{ lookSlug: look.slug }} className="cap slip__look" id="slipLook">
            Look {pad(look.n)} — {look.name}
          </Link>
        </div>
        <ul className="slip__lines" id="lines" role="list" ref={linesRef} onPointerLeave={() => api()?.setHot(0)}>
          {products.map((p, k) => {
            const isPicking = picking.includes(k);
            const brand = brandOf(p);
            return (
              <li
                key={p.slug}
                className={`line${added[k] ? " is-added" : ""}${isPicking ? " is-picking" : ""}${hot === k + 1 ? " is-hot" : ""}`}
                data-p={k + 1}
                onPointerOver={(ev) => ev.pointerType === "mouse" && hot !== k + 1 && api()?.setHot(k + 1)}
              >
                <Link to="/products/$productSlug" params={{ productSlug: p.slug }} className="line__name">
                  {p.name}
                </Link>
                <span className="line__price">{money(p.price)}</span>
                <span className="line__kind cap">
                  {kindLabel(p.kind)} ·{" "}
                  <Link to="/brands/$brandSlug" params={{ brandSlug: brand.slug }}>
                    {brand.name}
                  </Link>
                </span>
                <button
                  type="button"
                  className="line__add"
                  aria-expanded={isPicking}
                  aria-label={added[k] ? `Dans le panier : ${p.name}` : `Ajouter au panier : ${p.name}`}
                  onClick={() => {
                    api()?.stopAuto();
                    if (added[k]) return;
                    if (p.sizes.length === 1) addToBag([k]);
                    else setPicking((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));
                  }}
                />
                {isPicking && !added[k] && (
                  <div className="pick">
                    <div className="pick__sizes" role="group" aria-label="Taille">
                      {p.sizes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="size"
                          data-s={s}
                          aria-pressed={ls[k]!.size === s}
                          disabled={!sizeAvailable(p, s)}
                          aria-label={sizeAvailable(p, s) ? s : `${s}, épuisé`}
                          onClick={() => {
                            api()?.stopAuto();
                            updateLine(k, { size: s, touched: true });
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="pick__ok"
                      onClick={() => {
                        api()?.stopAuto();
                        updateLine(k, { touched: true });
                        addToBag([k]);
                      }}
                    >
                      Ajouter au panier
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <div className="slip__bundle">
          <p className="slip__msg" id="msg" role="status" aria-live="polite">
            {msg}
          </p>
          <dl className="sum">
            <div className="sum__sub">
              <dt className="cap">Sous-total</dt>
              <dd id="sumSub">{money(sub)}</dd>
            </div>
            <div className="sum__off">
              <dt className="cap">Look complet {MINUS}10 %</dt>
              <dd id="sumOff">
                {MINUS}
                {money(sub * 0.1)}
              </dd>
            </div>
            <div className="sum__total">
              <dt>Total</dt>
              <dd id="sumTotal">{money(sub * 0.9)}</dd>
            </div>
          </dl>
          <button type="button" className="slip__cta" id="cta" onClick={onCta}>
            <span className="t-add">Ajouter tout le look</span>
            <span className="t-done">Look complet dans votre panier</span>
            <svg viewBox="0 0 26 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M1 7h24M19 1l6 6-6 6" />
            </svg>
          </button>
        </div>
        <div className="slip__foot" aria-hidden="true">
          <div className="slip__code" />
          <span className="cap">Merci d’être passé par le cercle MARQ’CI.</span>
        </div>
      </aside>
    </section>
  );
}
