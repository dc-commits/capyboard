// Accents décomposés par normalize('NFD') : U+0300 à U+036F (écrits en code pour rester lisibles)
const COMBINING_MARKS = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g');

/** Minuscules sans accents, pour chercher « odin » comme « Odín » */
export function normalizeSearch(text: string): string {
  return text.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase().trim();
}

/** « 1 partie », « 3 parties » ; préciser le pluriel s'il n'est pas en « s » (« jeu » → « jeux ») */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count > 1 ? pluralForm : singular}`;
}
