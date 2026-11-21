/** Decorative, deterministic 25×25 QR-style code (Park–Miller LCG, seed 7). */
export function qrPath(): string {
  const N = 25;
  const cells: string[] = [];
  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 7; x++) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        if (edge || core) cells.push(`M${ox + x} ${oy + y}h1v1h-1z`);
      }
  };
  finder(0, 0);
  finder(18, 0);
  finder(0, 18);
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      if ((x < 8 && y < 8) || (x > 16 && y < 8) || (x < 8 && y > 16)) continue;
      if (rnd() > 0.52) cells.push(`M${x} ${y}h1v1h-1z`);
    }
  return cells.join("");
}
export const QR_PATH = qrPath();
