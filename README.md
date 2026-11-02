<p align="center">
  <img src="assets/logo.png" alt="Capy Board" width="140" />
</p>

<h1 align="center">Capy Board</h1>

<p align="center">Les règles et les scores de vos jeux de société, en toute zénitude 🦫🍊</p>

Application mobile (Android, iOS) pour lire les règles de ses jeux de société et tenir la feuille de score des parties. Tout reste sur le téléphone : pas de compte, pas de serveur, ça marche hors ligne.

## Fonctionnalités

- **Jeux** : Skyjo, Capybaraka, Flip 7 et Odin, avec recherche et favoris en tête de liste.
- **Règles** détaillées par sections, résumées d'après les livrets officiels.
- **Feuille de score** par manche, avec une aide au calcul propre à chaque jeu :
  - Skyjo : grille + « a fini la manche », doublement automatique du finisseur ;
  - Capybaraka : somme des cartes, pastèques et Fiesta, départage officiel des égalités ;
  - Flip 7 : sélection des cartes dans une fenêtre (numéros, bonus, ×2, Sauté), Flip 7 détecté seul ;
  - Odin : cartes restées en main.
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
    index.tsx          Accueil : recherche, parties en cours, jeux
    games/[id]/        Fiche d'un jeu, règles, nouvelle partie
    matches/[matchId]  Feuille de score d'une partie
    players/           Liste, création et fiche des joueurs
  components/          Composants partagés (saisie détaillée, avatar…)
  data/games.ts        Catalogue des jeux : fiche, règles, calcul des scores
  store/               Données persistées (parties, joueurs, favoris) et stats
assets/                Icônes, écran de démarrage, logo (source : logo.svg)
```

## Ajouter un jeu

Tout se passe dans [`src/data/games.ts`](src/data/games.ts), en ajoutant une entrée à `GAMES` :

```ts
{
  id: 'mon-jeu',
  name: 'Mon jeu',
  emoji: '🎲',
  players: '2 à 5 joueurs',
  duration: '30 min',
  winner: 'highest',                                // ou 'lowest'
  endCondition: { type: 'threshold', points: 100 }, // ou { type: 'rounds', count: 3 }
  rules: [{ title: 'But du jeu', body: '…', items: ['…', '1. étape numérotée'] }],
}
```

Sans `scoring`, on saisit directement un score par joueur et par manche. Avec `scoring`, la saisie est détaillée et le score calculé :

- `fields` : champs numériques (`kind: 'number'`) ou cases à cocher (`kind: 'toggle'`). Une case peut être `exclusive` (un seul joueur par manche), neutraliser d'autres champs (`disabledWhen`) ou former une grille de cartes (`group`, avec `groupLimits`).
- `compute(detail, round)` : le score d'un joueur, à partir de sa saisie et de celle de toute la manche.
- `tieBreakers` : critères de départage en cas d'égalité.
- `entry: 'modal'` : une ligne par joueur, la saisie s'ouvre dans une fenêtre.

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

Sur le téléphone : ouvrir l'app (téléchargement), la fermer complètement, la relancer (application).

Un **nouveau build** reste nécessaire pour une librairie native, l'icône ou l'écran de démarrage. Dans ce cas, augmenter `version` (et `android.versionCode`) dans `app.json` : le runtime suit la version, ce qui évite d'envoyer une mise à jour à un APK incompatible.

## Icônes

Le logo est dessiné en SVG ([`assets/logo.svg`](assets/logo.svg)). Les PNG (`icon.png`, icônes Android adaptative et monochrome, `splash-icon.png`, `favicon.png`) en sont dérivés : la mascotte sur fond crème `#F6E7D2`, réduite à ~62 % pour l'icône adaptative.
