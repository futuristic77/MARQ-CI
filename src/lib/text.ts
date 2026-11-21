/** Split a name into one or two balanced lines for the serif ring title. */
export function splitTitle(name: string): string[] {
  const words = name.split(" ");
  if (words.length === 1) return [name];
  const cut = Math.ceil(words.length / 2);
  return [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
}
