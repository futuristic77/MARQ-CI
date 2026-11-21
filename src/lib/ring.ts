/** Ring maths shared by the lookbook engine (kept pure for testing). */
export const mod = (a: number, n: number) => ((a % n) + n) % n;
export const wrapAngle = (a: number) => {
  const t = Math.PI * 2;
  a = mod(a + Math.PI, t) - Math.PI;
  return a === -Math.PI ? Math.PI : a;
};
/** Shortest signed step count from `from` to `target` around a ring of n. */
export const shortest = (target: number, from: number, n: number) => mod(target - from + n / 2, n) - n / 2;
