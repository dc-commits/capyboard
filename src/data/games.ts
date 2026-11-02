export type RuleSection = {
  title: string;
  body?: string;
  /** Liste à puces affichée sous le texte */
  items?: string[];
};

/** Valeurs saisies pour un joueur sur une manche, par clé de champ */
export type RoundDetail = Record<string, number>;

type ScoreFieldBase = {
  key: string;
  label: string;
  icon: string;
  /** Clé d'une case à cocher qui, cochée, neutralise ce champ (valeur 0) */
  disabledWhen?: string;
  /** Les cases d'un même groupe s'affichent en grille de cartes sous ce titre */
  group?: string;
};

export type ScoreField =
  | (ScoreFieldBase & {
      kind: 'number';
      /** Accepte les valeurs négatives */
      signed: boolean;
      /** Laissé vide, vaut 0 */
      optional?: boolean;
    })
  | (ScoreFieldBase & {
      /** Case à cocher, enregistrée comme 1 ou 0 */
      kind: 'toggle';
      /** Un seul joueur peut la cocher par manche */
      exclusive?: boolean;
    });

export type TieBreaker = {
  label: string;
  icon: string;
  better: 'highest' | 'lowest';
  /** Unité affichée après le total (ex. « pts » quand le champ saisi est un nombre de cartes) */
  unit?: string;
  /** Valeur d'une manche, additionnée sur toute la partie */
  value: (detail: RoundDetail) => number;
};

/** Saisie détaillée : le score de manche est calculé à partir de plusieurs champs */
export type DetailedScoring = {
  fields: ScoreField[];
  /**
   * Score d'un joueur pour la manche. `round` contient la saisie de tous les joueurs
   * (`null` si incomplète) ; renvoyer `null` si le score dépend d'une saisie manquante.
   */
  compute: (detail: RoundDetail, round: (RoundDetail | null)[]) => number | null;
  /** Critères de départage en cas d'égalité, appliqués dans l'ordre */
  tieBreakers: TieBreaker[];
  /** `modal` : une ligne par joueur, la saisie s'ouvre dans une fenêtre (pratique pour beaucoup de champs) */
  entry?: 'inline' | 'modal';
  /** Nombre maximum de cases cochées par groupe */
  groupLimits?: Record<string, number>;
  /** Indication affichée pendant la saisie d'un joueur */
  hint?: (detail: RoundDetail) => string | null;
};

/** Extension d'un jeu, choisie au lancement de chaque partie */
export type Expansion = {
  id: string;
  name: string;
  emoji: string;
  /** Règles ajoutées ou modifiées par l'extension, affichées après celles du jeu de base */
  rules: RuleSection[];
};

/** Quand la partie s'arrête : un joueur atteint un seuil, un nombre fixe de manches, ou quand on le décide */
export type EndCondition = { type: 'threshold'; points: number } | { type: 'rounds'; count: number } | { type: 'manual' };

export type Game = {
  id: string;
  name: string;
  emoji: string;
  minPlayers: number;
  /** Absent : pas de maximum (« 3 joueurs et plus ») */
  maxPlayers?: number;
  durationMinutes: number;
  /** Jeu créé dans l'app (modifiable), par opposition au catalogue intégré */
  custom?: boolean;
  /** Qui gagne : le plus haut total ou le plus bas */
  winner: 'highest' | 'lowest';
  endCondition: EndCondition;
  /** Remplace la description générée de la fin de partie (jeux sans score, par exemple) */
  endDescription?: string;
  /** Pas de score : en fin de partie, on désigne seulement le ou les gagnants */
  scoreless?: boolean;
  /** Sans ce champ, on saisit directement un score par joueur et par manche */
  scoring?: DetailedScoring;
  expansions?: Expansion[];
  rules: RuleSection[];
};

const FLIP7_NUMBERS = Array.from({ length: 13 }, (_, value) => value);
const FLIP7_BONUSES = [2, 4, 6, 8, 10];

function flip7NumberCount(detail: RoundDetail): number {
  return FLIP7_NUMBERS.filter((value) => detail[`n${value}`]).length;
}

/** Flip 7 : numéros (doublés par le ×2), puis bonus, puis 15 points pour 7 numéros différents */
function flip7Score(detail: RoundDetail): number {
  if (detail.bust) return 0;
  const numbers = FLIP7_NUMBERS.reduce((sum, value) => sum + (detail[`n${value}`] ? value : 0), 0);
  const bonus = FLIP7_BONUSES.reduce((sum, value) => sum + (detail[`b${value}`] ? value : 0), 0);
  return numbers * (detail.double ? 2 : 1) + bonus + (flip7NumberCount(detail) === 7 ? 15 : 0);
}

/** Capybaraka : 1, 3, 6, 10, 15 points pour 1 à 5 cartes Fiesta, puis +5 par carte */
export function capybarakaFiestaPoints(cards: number): number {
  const table = [0, 1, 3, 6, 10, 15];
  return cards < table.length ? table[cards] : 15 + (cards - 5) * 5;
}

// Les règles sont des résumés rédigés d'après les livrets officiels, pas des copies.
export const BUILT_IN_GAMES: Game[] = [
  {
    id: 'skyjo',
    name: 'Skyjo',
    emoji: '🃏',
    minPlayers: 2,
    maxPlayers: 8,
    durationMinutes: 30,
    winner: 'lowest',
    endCondition: { type: 'threshold', points: 100 },
    scoring: {
      fields: [
        { kind: 'number', key: 'grid', label: 'Grille', icon: '🃏', signed: true },
        { kind: 'toggle', key: 'finished', label: 'A fini la manche', icon: '🏁', exclusive: true },
      ],
      compute: ({ grid, finished }, round) => {
        // Seul le joueur qui a fini peut être doublé, et seulement si son score est positif
        if (!finished || grid <= 0) return grid;
        if (round.some((detail) => detail === null)) return null;
        const atOrBelow = round.filter((detail) => detail !== null && detail.grid <= grid).length;
        return atOrBelow === 1 ? grid : grid * 2;
      },
      tieBreakers: [],
    },
    rules: [
      {
        title: 'But du jeu',
        body: 'Avoir le moins de points possible. La partie se joue en plusieurs manches et s’arrête à la fin de la manche où un joueur atteint ou dépasse 100 points. Le plus petit total gagne.',
      },
      {
        title: 'Matériel',
        body: '150 cartes de −2 à 12 :',
        items: ['5 cartes −2', '10 cartes −1', '15 cartes 0', '10 cartes de chaque valeur de 1 à 12'],
      },
      {
        title: 'Mise en place',
        items: [
          'Mélanger et distribuer 12 cartes face cachée à chaque joueur.',
          'Chacun pose ses cartes en grille de 3 lignes × 4 colonnes, sans les regarder.',
          'Le reste forme la pioche ; retourner la première carte pour lancer la défausse.',
          'Chaque joueur retourne 2 cartes de son choix.',
          'Première manche : celui dont les 2 cartes font le plus gros total commence. Ensuite, c’est celui qui a terminé la manche précédente.',
        ],
      },
      {
        title: 'Tour de jeu',
        body: 'On joue dans le sens horaire. À son tour, on choisit une option :',
        items: [
          'Prendre la carte du dessus de la défausse et l’échanger avec une carte de sa grille (visible ou cachée). La carte remplacée part face visible sur la défausse.',
          'Piocher une carte, la regarder, puis soit l’échanger avec une carte de sa grille, soit la défausser et retourner une de ses cartes cachées.',
        ],
      },
      {
        title: 'Colonnes',
        body: 'Dès que les 3 cartes d’une colonne sont visibles et identiques, on les défausse : elles ne comptent plus et la grille rétrécit.',
      },
      {
        title: 'Fin de manche',
        items: [
          'Quand un joueur a retourné toutes ses cartes, chacun des autres joue encore un dernier tour.',
          'Tout le monde retourne alors ses cartes cachées et additionne sa grille.',
          'Si le joueur qui a terminé n’a pas strictement le plus petit score de la manche, son score est doublé (seulement s’il est positif).',
        ],
      },
      {
        title: 'Fin de partie',
        body: 'On additionne les manches. Dès qu’un joueur atteint 100 points en fin de manche, la partie s’arrête : le plus petit total l’emporte.',
      },
    ],
  },
  {
    id: 'capybaraka',
    name: 'Capybaraka',
    emoji: '🍉',
    minPlayers: 2,
    maxPlayers: 6,
    durationMinutes: 20,
    winner: 'highest',
    endCondition: { type: 'rounds', count: 2 },
    scoring: {
      fields: [
        { kind: 'number', key: 'sum', label: 'Somme', icon: '🧘', signed: true },
        { kind: 'number', key: 'watermelons', label: 'Pastèques', icon: '🍉', signed: false },
        { kind: 'number', key: 'fiesta', label: 'Fiesta', icon: '🎉', signed: false },
      ],
      compute: ({ sum, watermelons, fiesta }) => watermelons + capybarakaFiestaPoints(fiesta) - Math.abs(sum),
      tieBreakers: [
        { label: 'le plus petit écart à zéro', icon: '🧘', better: 'lowest', value: ({ sum }) => Math.abs(sum) },
        { label: 'le plus de pastèques', icon: '🍉', better: 'highest', value: ({ watermelons }) => watermelons },
        {
          label: 'le plus de points Fiesta',
          icon: '🎉',
          better: 'highest',
          unit: 'pts',
          value: ({ fiesta }) => capybarakaFiestaPoints(fiesta),
        },
      ],
    },
    rules: [
      {
        title: 'But du jeu',
        body: 'Marquer le plus de points en deux manches. Il y a trois façons de scorer :',
        items: [
          'Récolter des pastèques (1 point chacune).',
          'Faire une collection de cartes Fiesta (plus on en a, plus ça rapporte).',
          'Garder la somme de ses cartes la plus proche de zéro (l’écart coûte des points).',
        ],
      },
      {
        title: 'Matériel',
        items: [
          '72 cartes Zen, en paquets de 12 d’une même couleur, valeurs de −6 à +6. Certaines montrent 1 à 3 pastèques.',
          '72 cartes Capybara : 6 paquets de 12 cartes numérotées de 1 à 72. Chaque numéro est unique, donc jamais d’égalité.',
          '12 cartes Fiesta, valeurs de −6 à +6.',
          '1 carte mémo pour le décompte des Fiesta.',
        ],
      },
      {
        title: 'Mise en place',
        items: [
          'Mélanger autant de paquets Zen que de joueurs (3 joueurs = 3 couleurs…), y ajouter les cartes Fiesta et poser la pioche face cachée.',
          'À 2 joueurs, retirer les Fiesta −2, −1, +1 et +2. À 3 joueurs, retirer les Fiesta −1 et +1.',
          'Chaque joueur prend un paquet Capybara, le mélange, le pose face cachée devant lui et pioche 3 cartes : c’est sa main.',
        ],
      },
      {
        title: 'Déroulement d’un tour',
        body: 'Pas de premier joueur : tout le monde joue en même temps. Une manche dure 12 tours.',
        items: [
          '1. Révéler au centre autant de cartes de la pioche qu’il y a de joueurs.',
          '2. Chacun choisit secrètement une de ses 3 cartes Capybara et la pose face cachée.',
          '3. On révèle toutes les Capybara ensemble. Du plus grand numéro au plus petit, chaque joueur prend une carte au centre et la pose face visible devant lui (pas dans sa main).',
          '4. Chacun pose sa Capybara jouée sur sa défausse personnelle, annonce sa nouvelle somme, puis pioche la carte du dessus de son propre paquet Capybara pour revenir à 3 cartes.',
        ],
      },
      {
        title: 'Cartes Fiesta',
        body: 'Elles ont aussi une valeur de −6 à +6 qui compte dans la somme. Bonus selon le nombre de Fiesta :',
        items: [
          '1 carte : 1 point',
          '2 cartes : 3 points',
          '3 cartes : 6 points',
          '4 cartes : 10 points',
          '5 cartes : 15 points',
          'Puis +5 points par carte supplémentaire',
        ],
      },
      {
        title: 'Score de manche',
        body: 'Après 12 tours, chaque joueur calcule :',
        items: [
          'Somme de ses cartes : on perd autant de points que l’écart à 0 (+5 ou −3 → on perd 5 ou 3 points).',
          '+1 point par pastèque.',
          '+ le bonus de sa collection Fiesta.',
          'Astuce : ranger ses cartes en une colonne positive et une colonne négative pour suivre sa somme.',
        ],
      },
      {
        title: 'Deuxième manche',
        items: [
          'On échange les paquets Capybara : le meilleur score de la manche échange avec le moins bon, le 2e avec l’avant-dernier, etc. En nombre impair, le joueur du milieu garde son paquet.',
          'On remélange toutes les cartes Zen et Fiesta pour refaire la pioche.',
        ],
      },
      {
        title: 'Fin de partie',
        body: 'On additionne les deux manches : le plus haut total gagne. En cas d’égalité, on départage dans l’ordre par :',
        items: ['le plus petit écart à zéro', 'le plus de pastèques', 'le plus de points de collection Fiesta'],
      },
    ],
  },
  {
    id: 'flip7',
    name: 'Flip 7',
    emoji: '7️⃣',
    minPlayers: 3,
    durationMinutes: 20,
    winner: 'highest',
    endCondition: { type: 'threshold', points: 200 },
    scoring: {
      entry: 'modal',
      fields: [
        ...FLIP7_NUMBERS.map((value): ScoreField => ({
          kind: 'toggle',
          key: `n${value}`,
          label: String(value),
          icon: String(value),
          group: 'Numéros',
          disabledWhen: 'bust',
        })),
        ...FLIP7_BONUSES.map((value): ScoreField => ({
          kind: 'toggle',
          key: `b${value}`,
          label: `+${value}`,
          icon: `+${value}`,
          group: 'Bonus',
          disabledWhen: 'bust',
        })),
        { kind: 'toggle', key: 'double', label: '×2', icon: '×2', group: 'Bonus', disabledWhen: 'bust' },
        { kind: 'toggle', key: 'bust', label: 'Sauté', icon: '💥' },
      ],
      groupLimits: { Numéros: 7 },
      compute: (detail) => flip7Score(detail),
      hint: (detail) => {
        if (detail.bust) return 'Sauté : 0 point pour cette manche';
        const count = flip7NumberCount(detail);
        return count === 7 ? 'Flip 7 ! +15 points' : `${count}/7 numéros`;
      },
      tieBreakers: [],
    },
    rules: [
      {
        title: 'But du jeu',
        body: 'Jeu de « stop ou encore » : être le premier à atteindre 200 points. À chaque manche, on retourne des cartes pour cumuler des points, mais un numéro en double fait tout perdre.',
      },
      {
        title: 'Matériel',
        body: '94 cartes :',
        items: [
          'Cartes numéro de 0 à 12 : autant d’exemplaires que leur valeur (douze 12, onze 11… un 1) et un seul 0.',
          'Cartes action : Freeze, Flip Three, Second Chance.',
          'Cartes bonus : +2, +4, +6, +8, +10 et ×2.',
          'Au-delà de 18 joueurs, ajouter un second paquet.',
        ],
      },
      {
        title: 'Mise en place',
        items: [
          'Bien mélanger et désigner un donneur.',
          'Le donneur distribue une carte face visible à chacun, lui compris. Si une carte action sort, on s’arrête pour la résoudre, puis on reprend.',
          'Après la donne, certains peuvent avoir plusieurs cartes, d’autres aucune.',
        ],
      },
      {
        title: 'Tour de jeu',
        body: 'Le donneur propose à chaque joueur actif, dans l’ordre :',
        items: [
          'Hit (encore) : recevoir une carte de plus. Les numéros vont en ligne, les bonus au-dessus.',
          'Stay (stop) : sortir de la manche en encaissant ses points (possible dès qu’on a une carte devant soi).',
          'Si on reçoit un numéro qu’on a déjà : on saute (bust), on sort de la manche et on marque 0.',
        ],
      },
      {
        title: 'Flip 7',
        body: 'Avoir 7 numéros différents devant soi termine immédiatement la manche pour tout le monde et rapporte 15 points de bonus. Les cartes action et bonus ne comptent pas dans les 7 ; le 0 compte.',
      },
      {
        title: 'Cartes action',
        body: 'Elles se jouent sur n’importe quel joueur actif, soi-même compris (obligatoirement soi-même si on est le seul actif).',
        items: [
          'Freeze : le joueur ciblé encaisse ses points et sort de la manche.',
          'Flip Three : le joueur ciblé doit accepter les 3 cartes suivantes, une par une. On s’arrête plus tôt s’il saute ou réussit un Flip 7. Une Freeze ou Flip Three tirée pendant ce temps se résout après les 3 cartes (s’il n’a pas sauté).',
          'Second Chance : à garder. Si on reçoit un doublon, on défausse le doublon et la Second Chance. Une seule à la fois : une deuxième se donne à un autre joueur actif (ou se défausse). Les Second Chance non utilisées sont défaussées en fin de manche.',
        ],
      },
      {
        title: 'Cartes bonus',
        body: 'Ce ne sont pas des numéros : on ne peut pas sauter dessus et elles ne comptent pas pour le Flip 7.',
        items: [
          '+2 à +10 : s’ajoutent à la somme des numéros. On marque ces points même sans numéro.',
          '×2 : double la somme des numéros (pas les autres bonus).',
        ],
      },
      {
        title: 'Fin de manche et score',
        body: 'La manche s’arrête quand plus personne n’est actif, ou dès qu’un joueur réussit un Flip 7. Calcul du score :',
        items: [
          '1. Additionner ses numéros.',
          '2. Doubler si on a le ×2.',
          '3. Ajouter les bonus +2 à +10.',
          '4. Ajouter 15 points en cas de Flip 7.',
          'Un joueur qui a sauté marque 0.',
        ],
      },
      {
        title: 'Manche suivante',
        items: [
          'Mettre de côté les cartes jouées, sans les remélanger.',
          'Le paquet passe au joueur de gauche, qui devient donneur.',
          'Quand la pioche est vide, mélanger les cartes mises de côté. En cours de manche, on laisse les cartes devant les joueurs.',
        ],
      },
      {
        title: 'Fin de partie',
        body: 'À la fin de la manche où au moins un joueur atteint 200 points, le plus haut total gagne.',
      },
    ],
  },
  {
    id: 'odin',
    name: 'Odin',
    emoji: '🛡️',
    minPlayers: 2,
    maxPlayers: 6,
    durationMinutes: 20,
    winner: 'lowest',
    endCondition: { type: 'threshold', points: 15 },
    scoring: {
      fields: [{ kind: 'number', key: 'cards', label: 'Cartes en main', icon: '✋', signed: false }],
      compute: ({ cards }) => cards,
      tieBreakers: [],
    },
    rules: [
      {
        title: 'But du jeu',
        body: 'Se débarrasser de ses cartes le plus vite possible. Chaque carte restée en main en fin de manche coûte 1 point ; la partie s’arrête dès qu’un joueur atteint 15 points, et le plus petit total gagne.',
      },
      {
        title: 'Matériel',
        body: '54 cartes numérotées de 1 à 9, en 6 couleurs.',
      },
      {
        title: 'Mise en place',
        items: [
          'Mélanger et distribuer 9 cartes à chaque joueur ; le reste est mis de côté pour la manche.',
          'Le premier joueur est tiré au sort, puis on joue dans le sens horaire.',
        ],
      },
      {
        title: 'Combinaisons',
        body: 'Plusieurs cartes posées ensemble doivent avoir la même valeur ou la même couleur. On lit leur valeur en accolant les chiffres du plus grand au plus petit :',
        items: ['2 et 8 → 82', '2, 4 et 9 → 942', 'trois 5 → 555'],
      },
      {
        title: 'Tour de jeu',
        body: 'Celui qui lance le tour pose obligatoirement une seule carte, jamais plusieurs (sauf départ groupé, qui termine la manche). Ensuite, chacun à son tour :',
        items: [
          'Joue : pose autant de cartes qu’au centre, ou une de plus (jamais moins, jamais deux de plus), avec une valeur strictement supérieure.',
          'Puis reprend en main une des cartes qui étaient au centre ; les autres sont défaussées.',
          'Ou passe : il pourra rejouer à son prochain passage si le tour continue.',
        ],
      },
      {
        title: 'Fin d’un tour',
        body: 'Quand tous les joueurs sauf un ont passé d’affilée, on défausse le centre. Le dernier à avoir posé lance le tour suivant avec la carte de son choix (une seule).',
      },
      {
        title: 'Fin de manche',
        items: [
          'Main vide : poser sa dernière carte arrête la manche aussitôt, sans reprendre de carte au centre.',
          'Départ groupé : en lançant un tour, si toutes ses cartes restantes ont la même valeur ou la même couleur, on les pose d’un coup et la manche s’arrête.',
        ],
      },
      {
        title: 'Décompte',
        body: 'Chaque joueur marque 1 point par carte restée en main (0 pour celui qui a fini). On redistribue 9 cartes ; le joueur à gauche de celui qui avait commencé lance la manche suivante.',
      },
      {
        title: 'Fin de partie',
        body: 'Dès qu’un joueur atteint ou dépasse 15 points, la partie s’arrête : le plus petit total gagne. En cas d’égalité, les vainqueurs se partagent la victoire.',
        items: [
          'Partie courte : 10 points',
          'Partie longue : 20 points ou plus',
          'Partie express : une seule manche, le moins de cartes en main gagne',
        ],
      },
    ],
  },
  {
    id: 'six-qui-prend',
    name: '6 qui prend !',
    emoji: '🐮',
    minPlayers: 2,
    maxPlayers: 10,
    durationMinutes: 45,
    winner: 'lowest',
    // La partie s'arrête quand un joueur dépasse 66 têtes, donc à 67 ou plus
    endCondition: { type: 'threshold', points: 67 },
    scoring: {
      fields: [{ kind: 'number', key: 'heads', label: 'Têtes de bœuf', icon: '🐮', signed: false }],
      compute: ({ heads }) => heads,
      tieBreakers: [],
    },
    rules: [
      {
        title: 'But du jeu',
        body: 'Ramasser le moins de têtes de bœuf possible. On joue plusieurs manches jusqu’à ce qu’un joueur dépasse 66 têtes ; le plus petit total gagne.',
      },
      {
        title: 'Matériel',
        body: '104 cartes numérotées de 1 à 104. Chacune porte de 1 à 7 têtes de bœuf, qui sont des points de pénalité :',
        items: [
          'la plupart des cartes : 1 tête',
          'finissant par 5 (5, 15, 25…) : 2 têtes',
          'finissant par 0 (10, 20, 30…) : 3 têtes',
          'doublets (11, 22, 33…) : 5 têtes',
          '55 (doublet et finissant par 5) : 7 têtes',
        ],
      },
      {
        title: 'Mise en place',
        items: [
          'Distribuer 10 cartes à chaque joueur, qui les range par ordre croissant.',
          'Poser 4 cartes face visible l’une sous l’autre : chacune commence une rangée. Le reste ne sert pas pour la manche.',
        ],
      },
      {
        title: 'Tour de jeu',
        items: [
          '1. Chacun choisit une carte et la pose face cachée.',
          '2. On révèle tout en même temps.',
          '3. Du plus petit numéro au plus grand, chacun place sa carte au bout d’une rangée.',
        ],
      },
      {
        title: 'Où placer sa carte',
        items: [
          'Valeurs croissantes : une carte va toujours après une carte plus petite.',
          'Plus petite différence : parmi les rangées possibles, on doit choisir celle dont la dernière carte est la plus proche (en dessous).',
          'Le choix n’est donc jamais libre : chaque carte n’a qu’une seule place.',
        ],
      },
      {
        title: 'Ramasser une rangée',
        items: [
          'Sixième carte : une rangée compte au plus 5 cartes. Celui qui doit poser la 6e ramasse les 5 cartes, et sa carte commence la nouvelle rangée.',
          'Carte trop faible : si une carte est plus petite que la fin de toutes les rangées, son joueur ramasse la rangée de son choix (en général la moins chargée en têtes), et sa carte la remplace.',
          'Les cartes ramassées forment une pile de pénalités devant soi, jamais dans la main.',
        ],
      },
      {
        title: 'Fin de manche et de partie',
        body: 'Une manche s’arrête quand les 10 cartes sont jouées : chacun compte les têtes de sa pile. On enchaîne les manches jusqu’à ce qu’un joueur dépasse 66 têtes ; le plus petit total gagne. On peut aussi convenir d’un autre seuil ou d’un nombre de manches.',
      },
      {
        title: 'Variantes pour tacticiens',
        items: [
          'Toutes les cartes connues : on ne garde que les cartes de 1 à (joueurs × 10 + 4), par exemple 1 à 44 à 4 joueurs.',
          'Draft : les cartes sont étalées face visible et chacun choisit les siennes à tour de rôle jusqu’à en avoir 10.',
        ],
      },
    ],
  },
  {
    id: 'le-baron',
    name: '6 qui prend ! Le Baron',
    emoji: '🎩',
    minPlayers: 2,
    maxPlayers: 10,
    durationMinutes: 30,
    winner: 'lowest',
    // Une seule partie par défaut ; « Reprendre la partie » permet d'en enchaîner d'autres
    endCondition: { type: 'rounds', count: 1 },
    scoring: {
      fields: [{ kind: 'number', key: 'heads', label: 'Têtes de bœuf', icon: '🐮', signed: false }],
      compute: ({ heads }) => heads,
      tieBreakers: [],
    },
    rules: [
      {
        title: 'But du jeu',
        body: 'La version « couleurs » de 6 qui prend : on place ses cartes selon la couleur des têtes de bœuf, pas selon leur numéro. Le moins de points négatifs à la fin gagne.',
      },
      {
        title: 'Matériel',
        body: '110 cartes numérotées de 1 à 110, avec des têtes de bœuf de 6 couleurs : bleu, jaune, vert, rouge, noir et blanc. Le nombre en rouge sur chaque carte indique ses points négatifs.',
      },
      {
        title: 'Mise en place',
        items: [
          'Distribuer face cachée, selon le nombre de joueurs : 24 cartes à 2, 20 à 3, 16 de 4 à 6, 12 à 7 ou 8, 8 à 9 ou 10.',
          'Sans les regarder, chacun en fait sa pioche personnelle et en tire 4 : c’est sa main.',
          'Retourner 5 cartes en colonne au centre : chacune commence une rangée. Le reste retourne dans la boîte.',
        ],
      },
      {
        title: 'Tour de jeu',
        items: [
          '1. Chacun choisit une carte de sa main et la pose face cachée.',
          '2. On révèle tout en même temps.',
          '3. Du plus petit numéro au plus grand, chacun ajoute sa carte au bout d’une rangée.',
          'On ne repioche 4 cartes que lorsque ses 4 cartes en main ont toutes été jouées.',
        ],
      },
      {
        title: 'Où placer sa carte',
        items: [
          'Couleur avec couleur : la dernière carte de la rangée doit montrer au moins une tête de la même couleur qu’une tête de sa carte.',
          'S’il y a plusieurs rangées possibles, on choisit librement (ou celle qui embête le plus les autres).',
          'Les numéros ne servent qu’à fixer l’ordre de jeu, pas les rangées.',
          'Le Baron (cartes 52 et 104) a les 6 couleurs : il va dans n’importe quelle rangée.',
        ],
      },
      {
        title: 'Ramasser une rangée',
        items: [
          'Sixième carte : celui qui pose la 6e carte d’une rangée ramasse les 5 premières ; sa carte commence la rangée.',
          'Six têtes d’une couleur : si la rangée compte alors 6 têtes ou plus d’une même couleur, on ramasse toutes les cartes à gauche de la sienne ; sa carte devient la première.',
          'Aucune couleur commune : on ramasse la rangée de son choix et sa carte la remplace.',
          'Les cartes ramassées forment une pile de points négatifs devant soi, jamais dans la main ni la pioche.',
        ],
      },
      {
        title: 'Fin de partie',
        body: 'Quand toutes les cartes ont été jouées, chacun compte ses points négatifs (6 pour un Baron). Le plus petit total gagne ; en cas d’égalité, on partage la victoire. On peut aussi convenir à l’avance de plusieurs parties et additionner les scores.',
      },
      {
        title: 'Variantes',
        items: [
          'La couleur prime : on supprime la règle de la sixième carte ; on ne ramasse qu’avec six têtes d’une couleur ou sans couleur commune.',
          'Points positifs : les têtes ramassées rapportent des points. Une carte qu’on ne peut poser nulle part repart sous sa pioche ; la partie s’arrête à la fin du tour où quelqu’un a posé sa dernière carte, et les têtes restées en main ou en pioche comptent en négatif.',
        ],
      },
    ],
  },
  {
    id: 'mycelia',
    name: 'Mycelia',
    emoji: '🍄',
    minPlayers: 1,
    maxPlayers: 4,
    durationMinutes: 45,
    // Course : le premier à vider son plateau gagne, il n'y a pas de score à noter
    winner: 'highest',
    scoreless: true,
    endCondition: { type: 'manual' },
    endDescription: 'quand un joueur a retiré toutes ses gouttes (on finit le tour)',
    rules: [
      {
        title: 'But du jeu',
        body: 'Un jeu de deck-building dans une forêt de champignons : chacun améliore son paquet de cartes pour retirer le plus vite possible les gouttes de rosée de son plateau. Le premier à vider son plateau gagne.',
      },
      {
        title: 'Mise en place',
        items: [
          'Chaque joueur prend un plateau, ses cartes action a et b, et place 20 gouttes de rosée selon la carte de mise en place.',
          'Il mélange ses 6 cartes de départ et en pioche 3 : c’est sa main.',
          'Le sanctuaire va au centre, avec le dé de réserve sur l’emplacement correspondant au nombre de joueurs. On tire une carte de réserve au hasard.',
          'On mélange les 40 cartes et on en révèle 5 : c’est la vitrine. Les feuilles (la monnaie) forment une réserve commune.',
        ],
      },
      {
        title: 'Tour de jeu',
        items: [
          '1. Jouer ses 3 cartes une par une, en appliquant chaque effet avant la suivante : déplacer, retirer des gouttes, gagner des feuilles…',
          '2. À tout moment, acheter des cartes de la vitrine avec ses feuilles (de 2 à 8).',
          '3. Utiliser au plus une fois chacune les actions de base : a (1 feuille) renouvelle la vitrine, b (3 feuilles) déplace une goutte d’une case.',
          '4. Défausser les cartes jouées, compléter la vitrine à 5 cartes et repiocher 3 cartes.',
        ],
      },
      {
        title: 'Gouttes et sanctuaire',
        items: [
          'Une goutte qui atteint la case sanctuaire de son plateau, ou qu’un effet retire, est déposée dans le sanctuaire à la fin du tour.',
          'Quand le sanctuaire est plein (20 gouttes à 4 joueurs, 15 à 3, 10 à 2), on le fait tourner : la carte de réserve indique combien de gouttes (1 ou 2) chacun remet sur son plateau. Le reste quitte la partie et la carte de réserve est retournée.',
        ],
      },
      {
        title: 'Fin de partie',
        items: [
          'Quand un joueur retire sa dernière goutte, on termine le tour pour que tout le monde ait joué autant de fois. Si cette dernière goutte remplit le sanctuaire, on ne le fait pas tourner.',
          'Gagne celui qui n’a plus de gouttes sur son plateau.',
          'Si plusieurs joueurs ont vidé leur plateau, celui qui a le plus de feuilles l’emporte ; en cas d’égalité, ils partagent la victoire.',
        ],
      },
      {
        title: 'Mode solo',
        body: 'On affronte Gwidyon, un adversaire virtuel avec ses propres cartes et 20 gouttes. Le sanctuaire tourne dès 10 gouttes, mais Gwidyon ne reçoit jamais de nouvelles gouttes. Le premier à vider son plateau gagne. Pour corser la partie, donner 21 à 25 gouttes à Gwidyon.',
      },
    ],
    expansions: [
      {
        id: 'prisma',
        name: 'Prisma',
        emoji: '🌈',
        rules: [
          {
            title: 'Ce qui change',
            body: 'Toutes les règles du jeu de base s’appliquent. Prisma ajoute des gouttes prismatiques, des faveurs et des cartes cadeaux de la déesse de la forêt.',
          },
          {
            title: 'Mise en place',
            items: [
              'Mélanger les 40 cartes de base, les 30 cartes d’extension de la boîte de base et les 20 cartes Prisma en une seule pioche.',
              'Placer la barre des faveurs sur le sanctuaire, et sur chaque plateau 12 gouttes de rosée et 10 gouttes prismatiques selon la nouvelle carte de mise en place.',
              'Chacun reçoit une zone cadeaux, un champignon (posé sur la case 0 de la barre) et une septième carte de départ à sa rune. À 3 joueurs, un champignon inutilisé bloque la case I ; à 2, deux bloquent les cases I et II.',
              'Former trois piles de cartes cadeaux face visible : verte, ambre et violette.',
            ],
          },
          {
            title: 'Faveurs et cadeaux',
            items: [
              'Une goutte prismatique se déplace et se retire comme une goutte de rosée. Chaque goutte prismatique retirée rapporte une faveur : on avance son champignon d’une case libre sur la barre.',
              'On dépense ses faveurs pour acheter une carte cadeau de la couleur atteinte (ou moins chère) : le champignon revient à 0, sans rendu de monnaie. La carte va sur sa pioche.',
              'Une carte cadeau piochée se pose aussitôt dans sa zone cadeaux et fait piocher autant de cartes que son chiffre (0 à 3). Son effet dure tout le tour, puis elle est défaussée.',
              'Quand le sanctuaire déborde, seules des gouttes de rosée reviennent, jamais de gouttes prismatiques.',
            ],
          },
          {
            title: 'Fin de partie',
            body: 'Comme dans le jeu de base, avec un départage de plus : si plusieurs joueurs ont vidé leur plateau, celui qui a le plus de feuilles gagne, puis, en cas d’égalité, celui qui a le plus de faveurs restantes.',
          },
        ],
      },
    ],
  },
  {
    id: 'service-compris',
    name: 'Service compris !',
    emoji: '🍽️',
    minPlayers: 3,
    maxPlayers: 6,
    durationMinutes: 45,
    // Jeu d'élimination : le dernier peuple encore en jeu gagne, il n'y a pas de score
    winner: 'highest',
    scoreless: true,
    endCondition: { type: 'manual' },
    endDescription: 'quand il ne reste plus qu’un peuple (ou aucun)',
    rules: [
      {
        title: 'But du jeu',
        body: 'Chaque joueur est le chef d’une tribu capturée par un géant affamé. Livrez les personnages adverses au géant et sauvez les vôtres : le dernier peuple qui n’a pas été entièrement dévoré gagne.',
      },
      {
        title: 'Matériel',
        items: [
          'Un plateau : la table du géant, avec son assiette et sa poubelle.',
          '6 peuples de 9 cartes (un chef et 8 membres) : Citrouilles, Dryades, Gobelins, Orcs, Sorcières et Trolls.',
          '56 cartes action : attaque (rouges), sauvegarde (vertes) et contre (bleues).',
        ],
      },
      {
        title: 'Mise en place',
        items: [
          'Chacun choisit un peuple et pose ses 9 personnages face visible devant lui.',
          'Le donneur distribue 5 cartes action à chacun ; le reste forme la pioche.',
        ],
      },
      {
        title: 'Tour de jeu',
        items: [
          'Le donneur commence, puis on joue dans le sens horaire.',
          '1. Piocher une carte action.',
          '2. En jouer une (attaque ou sauvegarde), avec ou sans effet ; elle est défaussée.',
          'Un personnage livré au géant va sur sa table : le premier au plus près de l’assiette, les suivants derrière.',
          'Une carte contre se joue pendant le tour d’un adversaire, une seule par action ; son joueur repioche aussitôt et le jeu reprend avec lui. On a toujours 5 cartes en main.',
        ],
      },
      {
        title: 'Le gueuleton',
        items: [
          'Le géant passe à table quand il y a plus de 5 personnages sur sa table, quand il reste moins de 7 personnages en jeu, ou quand on joue « Hors d’œuvre », « Goinfrerie » ou « Buffet à volonté ».',
          'Dès le tour suivant, au début de chaque tour, il dévore le personnage le plus près de l’assiette (deux par tour après « Goinfrerie » ou « Buffet à volonté »).',
          'Le repas s’arrête dès que sa table est vide. Les personnages dévorés vont à la poubelle et quittent la partie.',
        ],
      },
      {
        title: 'Cartes action',
        items: [
          'Attaque : livrer des personnages adverses au géant (« À table ! », « Plat du jour » au plus près de l’assiette, « Fromage et dessert » pour deux, « Panier garni » un chez chaque adversaire, « Choucroute melba » qui fait dévorer toute la table…).',
          'Sauvegarde : reprendre des personnages sur la table du géant (« Retour en cuisine », « Vénéneux »), en échanger, réorganiser la table (« Chaud devant ») ou arrêter le repas.',
          'Contre : annuler ou réduire une action adverse (« Surprise du chef », « Trop salé », « Le chef est parti », « Garde-manger »).',
        ],
      },
      {
        title: 'Fin de partie',
        body: 'Un joueur est éliminé dès que son dernier personnage est dévoré, et ses cartes action sont défaussées. La partie s’arrête quand il ne reste plus qu’un peuple en jeu : il gagne. Si aucun ne survit, personne ne gagne.',
      },
    ],
  },
];

export function formatPlayers(game: Pick<Game, 'minPlayers' | 'maxPlayers'>): string {
  if (game.maxPlayers === undefined) return `${game.minPlayers} joueurs et plus`;
  if (game.maxPlayers === game.minPlayers) return `${game.minPlayers} joueurs`;
  return `${game.minPlayers} à ${game.maxPlayers} joueurs`;
}

export function formatDuration(game: Pick<Game, 'durationMinutes'>): string {
  return `${game.durationMinutes} min`;
}

/** « dès qu'un joueur atteint 100 points », « après 2 manches »… */
export function describeEnd(endCondition: EndCondition): string {
  if (endCondition.type === 'rounds') return `après ${endCondition.count} manche${endCondition.count > 1 ? 's' : ''}`;
  if (endCondition.type === 'threshold') return `dès qu’un joueur atteint ${endCondition.points} points`;
  return 'quand vous le décidez';
}

/** Un nombre de joueurs donné peut-il jouer à ce jeu ? */
export function acceptsPlayers(game: Pick<Game, 'minPlayers' | 'maxPlayers'>, count: number): boolean {
  return count >= game.minPlayers && (game.maxPlayers === undefined || count <= game.maxPlayers);
}
