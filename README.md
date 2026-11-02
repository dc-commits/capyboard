<p align="center">
  <img src="assets/logo.png" alt="Capy Board" width="140" />
</p>

<h1 align="center">Capy Board</h1>

<p align="center">Les règles et les scores de vos jeux de société, en toute zénitude 🦫🍊</p>

Application mobile (Android, iOS) pour lire les règles de ses jeux de société et tenir la feuille de score des parties. Tout reste sur le téléphone : pas de compte, pas de serveur, ça marche hors ligne.

## Fonctionnalités

- **Bibliothèque de jeux** : on choisit ses jeux dans le catalogue (Skyjo, Capybaraka, Flip 7, Odin, 6 qui prend !, Le Baron, Mycelia) et on peut **créer les siens** depuis l'app (fiche, fin de partie, règles).
- **Recherche, tri et filtres** : favoris en tête, tri A → Z, plus joués ou récents, filtres par nombre de joueurs et durée.
- **Règles** détaillées par sections, résumées d'après les livrets officiels.
- **Feuille de score** par manche, avec une aide au calcul propre à chaque jeu :
  - Skyjo : grille + « a fini la manche », doublement automatique du finisseur ;
  - Capybaraka : somme des cartes, pastèques et Fiesta, départage officiel des égalités ;
  - Flip 7 : sélection des cartes dans une fenêtre (numéros, bonus, ×2, Sauté), Flip 7 détecté seul ;
  - Odin : cartes restées en main ;
  - 6 qui prend ! et Le Baron : têtes de bœuf ;
  - Mycelia : jeu de course sans score, on désigne simplement le ou les gagnants.
- **Extensions** : choisies au lancement de la partie (Mycelia – Prisma), avec leurs règles dans un onglet à part.
- **Fin de partie automatique** (seuil de points ou nombre de manches), reprise et revanche.
- **Parties en cours** sur l'accueil, pour reprendre en un toucher.
- **Profils de joueurs** (avatar, couleur) et **statistiques** : victoires, meilleur score, moyenne par jeu.

## Stack

- [Expo](https://docs.expo.dev/) SDK 58, React Native, TypeScript
- [Expo Router](https://docs.expo.dev/router/introduction/) : un fichier par écran dans `src/app/`
- AsyncStorage pour les données (parties, profils, favoris)
- [EAS Build](https://docs.expo.dev/build/introduction/) pour l'APK, [EAS Update](https://docs.expo.dev/eas-update/introduction/) pour les mises à jour à distance

## Démarrer

```bash
npm install
npx expo start
```

Puis scanner le QR code avec **Expo Go** (Android, iOS). Si le téléphone n'atteint pas le Mac (Wi-Fi d'entreprise…), passer par le tunnel Expo (compte Expo requis : `npx expo login`) :

```bash
npx expo start --tunnel
```

Aperçu dans un navigateur : `npx expo start --web`.

Avant de livrer :

```bash
npx tsc --noEmit
npx expo lint
```

## Structure

```
src/
  app/                 Écrans (Expo Router)
    index.tsx          Accueil : recherche, parties en cours, bibliothèque, tri et filtres
    library.tsx        Catalogue : ajouter/retirer des jeux, créer un jeu
    games/[id]/        Fiche d'un jeu, règles, nouvelle partie, modification
    games/new.tsx      Création d'un jeu
    matches/[matchId]  Feuille de score d'une partie
    players/           Liste, création et fiche des joueurs
  components/          Composants partagés (saisie détaillée, avatar…)
  data/games.ts        Catalogue intégré : fiche, règles, calcul des scores
  store/               Données persistées (jeux créés et bibliothèque, parties, joueurs, favoris) et stats
assets/                Icônes, écran de démarrage, logo (source : logo.svg)
```

## Ajouter un jeu

Depuis l'app : « Ajouter des jeux » en bas de l'accueil, puis « Créer un jeu ». Les jeux créés utilisent la saisie simple (un score par joueur et par manche) ; leurs règles se tapent avec « # Titre », « - puce » et « 1. étape ».

Pour un jeu du catalogue avec une aide au calcul, tout se passe dans [`src/data/games.ts`](src/data/games.ts), en ajoutant une entrée à `BUILT_IN_GAMES` :

```ts
{
  id: 'mon-jeu',
  name: 'Mon jeu',
  emoji: '🎲',
  minPlayers: 2,
  maxPlayers: 5,                                    // absent : pas de maximum
  durationMinutes: 30,
  winner: 'highest',                                // ou 'lowest'
  endCondition: { type: 'threshold', points: 100 }, // ou { type: 'rounds', count: 3 }, { type: 'manual' }
  rules: [{ title: 'But du jeu', body: '…', items: ['…', '1. étape numérotée'] }],
}
```

Sans `scoring`, on saisit directement un score par joueur et par manche. Avec `scoring`, la saisie est détaillée et le score calculé :

- `fields` : champs numériques (`kind: 'number'`) ou cases à cocher (`kind: 'toggle'`). Une case peut être `exclusive` (un seul joueur par manche), neutraliser d'autres champs (`disabledWhen`) ou former une grille de cartes (`group`, avec `groupLimits`).
- `compute(detail, round)` : le score d'un joueur, à partir de sa saisie et de celle de toute la manche.
- `tieBreakers` : critères de départage en cas d'égalité.
- `entry: 'modal'` : une ligne par joueur, la saisie s'ouvre dans une fenêtre.

Autres options d'un jeu :

- `scoreless: true` : pas de score, la partie se termine en désignant le ou les gagnants (avec `endDescription` pour décrire la fin).
- `expansions` : extensions choisies au lancement de la partie, chacune avec ses règles en plus.

Les règles sont des résumés rédigés, pas des copies des livrets.

## Build et mises à jour

L'APK Android se construit dans le cloud avec EAS (projet [@tazmaniack/capyboard](https://expo.dev/accounts/tazmaniack/projects/capyboard)) :

```bash
npx eas-cli@latest build -p android --profile preview
```

L'APK écoute le canal `preview` d'EAS Update. Pour envoyer une évolution sans rebuild (écrans, règles, scores, nouveaux jeux) :

```bash
npm run update:preview -- --message "Description de la nouveauté"
```

Sur le téléphone, l'app télécharge la mise à jour au lancement et affiche un bandeau « Nouvelle version prête » sur l'accueil : un toucher l'installe. L'écran « À propos » permet aussi de vérifier à la main.

Un **nouveau build** reste nécessaire pour une librairie native, l'icône ou l'écran de démarrage, avec `android.versionCode` augmenté dans `app.json`. Pour une **librairie native**, augmenter aussi `version` : le runtime suit la version, ce qui évite d'envoyer une mise à jour à un APK incompatible. Un changement d'icône ou d'écran de démarrage ne touche pas au code et garde la même `version`.

## Logo et icônes

Le logo source est [`assets/brand/capyboard-logo-source.webp`](assets/brand/capyboard-logo-source.webp) (1254 × 1254, fond transparent). Les images de l'app en sont dérivées :

- `logo.png` et `splash-icon.png` : le logo complet, recadré sur son contenu ;
- `icon.png` : le buste du capybara (sans le texte, illisible en petit) sur le jaune du soleil `#FDD447` ;
- `android-icon-foreground.png` : le même buste, réduit pour tenir dans le cercle de l'icône adaptative Android (fond `#FDD447`) ;
- `favicon.png` : le buste en 48 px.

## Avatars

Les 20 avatars capybara viennent de la planche [`assets/brand/avatars-source.webp`](assets/brand/avatars-source.webp) (5 × 4). Son fond en damier faisait partie de l'image : chaque avatar a été détouré (fond retiré depuis les bords, arrêté par le contour noir du dessin), recadré et réduit en 256 × 256 dans [`assets/avatars/`](assets/avatars). Un profil enregistre `capy:<nom>` pour un avatar illustré, ou directement un emoji.
