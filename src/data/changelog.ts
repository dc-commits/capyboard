export type ChangelogEntry = {
  /** Identifiant unique, jamais réutilisé : la date de publication, avec un suffixe si besoin */
  id: string;
  /** Date affichée, AAAA-MM-JJ */
  date: string;
  title: string;
  /** Une ligne par nouveauté, qui commence par un emoji */
  items: string[];
};

/**
 * Nouveautés, la plus récente en premier. À chaque mise à jour visible pour les joueurs,
 * ajouter une entrée en tête : la fenêtre « Quoi de neuf » s'affichera au lancement suivant.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    id: '2026-11-23-c',
    date: '2026-11-23',
    title: 'Boutons du téléphone bien visibles',
    items: ['🤎 Un fondu brun capybara en bas de l’écran : les boutons retour, accueil et applis ressortent enfin'],
  },
  {
    id: '2026-11-23-b',
    date: '2026-11-23',
    title: 'Règles et scores plus pratiques',
    items: [
      '📖 Sommaire en haut des règles longues : un toucher pour aller à la bonne section',
      '⬆️ Bouton pour remonter en haut des règles',
      '➖ Bouton ± à côté des scores qui peuvent être négatifs (Skyjo, Capybaraka, jeux créés)',
    ],
  },
  {
    id: '2026-11-23',
    date: '2026-11-23',
    title: 'Vengeance et démarrage éclair',
    items: [
      '😈 Nouveau jeu : Flip 7: With a Vengeance, avec son calcul des scores',
      '⚡ L’app démarre directement sur un accueil complet, sans écran vide',
      '🎁 Cette fenêtre « Quoi de neuf », pour ne plus rater les nouveautés',
    ],
  },
  {
    id: '2026-11-09-b',
    date: '2026-11-09',
    title: 'Suspense et boîte à outils',
    items: [
      '🙈 Scores cachés : les totaux restent secrets jusqu’à la révélation finale',
      '🧰 Boîte à outils : dés, sablier, tirage du premier joueur, pile ou face',
    ],
  },
  {
    id: '2026-11-09',
    date: '2026-11-09',
    title: 'Sauvegarde et classements',
    items: [
      '☁️ Sauvegarde dans ton Google Drive, automatique quand tu quittes l’app',
      '🏅 Classement général tous jeux confondus, par mois, par année ou depuis toujours',
      '📅 Calendrier des journées de jeu, avec le champion de chaque jour',
    ],
  },
];

/** Nouveautés pas encore vues : celles publiées après `lastSeenId` (toutes si l'identifiant est inconnu) */
export function unseenEntries(lastSeenId: string | null): ChangelogEntry[] {
  const index = CHANGELOG.findIndex((entry) => entry.id === lastSeenId);
  return index === -1 ? CHANGELOG : CHANGELOG.slice(0, index);
}

export function formatChangelogDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
