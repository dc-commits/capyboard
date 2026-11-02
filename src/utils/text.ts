// Accents décomposés par normalize('NFD') : U+0300 à U+036F (écrits en code pour rester lisibles)
const COMBINING_MARKS = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g');

/** Minuscules sans accents, pour chercher « odin » comme « Odín » */
export function normalizeSearch(text: string): string {
  return text.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase().trim();
}
