export type RuleSection = {
  title: string;
  body: string;
};

export type Game = {
  id: string;
  name: string;
  emoji: string;
  players: string;
  duration: string;
  /** Qui gagne : le plus haut total ou le plus bas */
  winner: 'highest' | 'lowest';
  rules: RuleSection[];
};

// Les règles sont des résumés rédigés, pas les livrets officiels.
export const GAMES: Game[] = [
  {
    id: 'skyjo',
    name: 'Skyjo',
    emoji: '🃏',
    players: '2 à 8 joueurs',
    duration: '30 min',
    winner: 'lowest',
    rules: [
      {
        title: 'But du jeu',
        body: "Finir la partie avec le moins de points possible. La partie s'arrête dès qu'un joueur atteint 100 points en fin de manche.",
      },
      {
        title: 'Mise en place',
        body: 'Chaque joueur reçoit 12 cartes face cachée, disposées en 3 lignes de 4. Il en retourne 2 au hasard. Le joueur avec le plus gros total commence.',
      },
      {
        title: 'Tour de jeu',
        body: "Prendre la carte de la défausse ou de la pioche. On peut l'échanger avec une de ses cartes (la carte remplacée part à la défausse), ou défausser la carte piochée et retourner une de ses cartes cachées.",
      },
      {
        title: 'Colonnes',
        body: 'Trois cartes identiques et visibles dans une même colonne sont défaussées : elles ne comptent plus.',
      },
      {
        title: 'Fin de manche',
        body: "Quand un joueur a retourné toutes ses cartes, les autres jouent un dernier tour. Si celui qui a fini n'a pas strictement le plus petit score de la manche, ses points sont doublés.",
      },
    ],
  },
  {
    id: 'capybaraka',
    name: 'Capybaraka',
    emoji: '🍉',
    players: '2 à 6 joueurs',
    duration: '20 min',
    winner: 'highest',
    rules: [
      {
        title: 'But du jeu',
        body: 'Avoir le plus de points après deux manches, en ramassant des pastèques et des collections Fiesta, tout en gardant sa zénitude au plus près de zéro.',
      },
      {
        title: 'Tour de jeu',
        body: "On révèle au centre autant de cartes Zen qu'il y a de joueurs. Chacun choisit en secret une de ses 3 cartes Capybara, puis tout le monde la révèle en même temps. Du plus grand numéro au plus petit, chaque joueur prend une carte au centre.",
      },
      {
        title: 'Manches',
        body: 'Une manche dure douze tours. La partie se joue en deux manches, en échangeant les paquets entre les deux.',
      },
      {
        title: 'Score de manche',
        body: "Pastèques + collections Fiesta − écart à zéro. Trop positif comme trop négatif, l'écart coûte des points : il faut rester zen !",
      },
    ],
  },
  {
    id: 'flip7',
    name: 'Flip 7',
    emoji: '7️⃣',
    players: '3 joueurs et plus',
    duration: '20 min',
    winner: 'highest',
    rules: [
      {
        title: 'But du jeu',
        body: 'Être le premier à atteindre 200 points. On finit la manche en cours, et le plus haut total gagne.',
      },
      {
        title: 'Tour de jeu',
        body: "À son tour, on retourne une carte devant soi ou on s'arrête pour encaisser ses points. Si on retourne un numéro qu'on a déjà, on saute : zéro point pour la manche.",
      },
      {
        title: 'Flip 7',
        body: 'Réunir 7 numéros différents met fin immédiatement à la manche et rapporte 15 points de bonus.',
      },
      {
        title: 'Cartes action',
        body: 'Freeze : le joueur ciblé encaisse et sort de la manche. Flip Three : il doit retourner trois cartes. Second Chance : annule un doublon (on défausse le doublon et la carte), une seule à la fois.',
      },
      {
        title: 'Décompte',
        body: 'On additionne ses numéros, on double avec le ×2, puis on ajoute les bonus (+2 à +10). Le ×2 ne double pas les bonus.',
      },
    ],
  },
];

export function getGame(id: string): Game | undefined {
  return GAMES.find((game) => game.id === id);
}
