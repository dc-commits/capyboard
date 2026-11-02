import type { RuleSection } from '@/data/games';

/**
 * Transforme les règles tapées dans l'app en sections :
 * « # Titre » ouvre une section, « - … » fait une puce, « 1. … » une étape numérotée,
 * le reste forme le texte de la section.
 */
export function parseRules(text: string): RuleSection[] {
  const sections: RuleSection[] = [];
  let current: RuleSection | null = null;
  const section = (): RuleSection => {
    if (!current) {
      current = { title: 'Règles' };
      sections.push(current);
    }
    return current;
  };

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('#')) {
      current = { title: line.replace(/^#+\s*/, '') || 'Règles' };
      sections.push(current);
    } else if (line.startsWith('- ')) {
      const target = section();
      target.items = [...(target.items ?? []), line.slice(2).trim()];
    } else if (/^\d+\.\s/.test(line)) {
      const target = section();
      target.items = [...(target.items ?? []), line];
    } else {
      const target = section();
      target.body = target.body ? `${target.body}\n${line}` : line;
    }
  }
  return sections;
}
