import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useBag } from "@/lib/bag";
import { useAdminTap } from "@/lib/admin-tap";

function useClock() {
  const [t, setT] = useState("06:00");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
    let to: ReturnType<typeof setTimeout>;
    const tickClock = () => {
      setT(fmt.format(new Date()));
      to = setTimeout(tickClock, 60000 - (Date.now() % 60000) + 50);
    };
    tickClock();
    return () => clearTimeout(to);
  }, []);
  return t;
}

export function StatusBar({ variant = "deck" }: { variant?: "deck" | "site" }) {
  const clock = useClock();
  const onBrandTap = useAdminTap();
  const { count, ready } = useBag();
  const wasReady = useRef(false);
  const tallyRef = useRef<HTMLSpanElement>(null);
  const prev = useRef(count);

  useEffect(() => {
    const el = tallyRef.current;
    if (!wasReady.current) {
      wasReady.current = ready;
      prev.current = count;
      return;
    }
    if (el && count > prev.current) {
      el.classList.remove("bump");
      void el.offsetWidth;
      el.classList.add("bump");
    }
    prev.current = count;
  }, [count, ready]);

  return (
    <header className={`bar${variant === "site" ? " bar--site" : ""}`}>
      <span className="stat cap" id="clock" aria-hidden="true" suppressHydrationWarning>
        {clock}
      </span>
      <span className="stat stat--signal cap">
        <span className="signal" aria-hidden="true">
          <i /><i /><i /><i />
        </span>
        <span className="stat__txt">Abidjan</span>
      </span>
      <Link to="/" className="brand" aria-label="Accueil MARQ’CI" onClick={onBrandTap}>
        MARQ’CI
      </Link>
      <span className="stat stat--battery cap">
        <span className="cell" aria-hidden="true"><b /></span>
        Vol. 01
      </span>
      <Link to="/bag" className="bagbtn pill" aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`}>
        Panier (<span className="tally" data-tally ref={tallyRef}>{count}</span>)
      </Link>
    </header>
  );
}
