import type { ImageSourcePropType } from 'react-native';

/** Préfixe des avatars illustrés ; les autres avatars sont des emojis (profils plus anciens) */
const CAPY_PREFIX = 'capy:';

/** Avatars capybara illustrés, dans l'ordre du sélecteur */
const CAPY_IMAGES: Record<string, ImageSourcePropType> = {
  zen: require('../../assets/avatars/zen.png'),
  plage: require('../../assets/avatars/plage.png'),
  astronaute: require('../../assets/avatars/astronaute.png'),
  'super-heros': require('../../assets/avatars/super-heros.png'),
  sieste: require('../../assets/avatars/sieste.png'),
  musique: require('../../assets/avatars/musique.png'),
  pasteque: require('../../assets/avatars/pasteque.png'),
  bain: require('../../assets/avatars/bain.png'),
  magicien: require('../../assets/avatars/magicien.png'),
  explorateur: require('../../assets/avatars/explorateur.png'),
  hockey: require('../../assets/avatars/hockey.png'),
  carton: require('../../assets/avatars/carton.png'),
  chef: require('../../assets/avatars/chef.png'),
  flamant: require('../../assets/avatars/flamant.png'),
  dino: require('../../assets/avatars/dino.png'),
  amoureux: require('../../assets/avatars/amoureux.png'),
  pirate: require('../../assets/avatars/pirate.png'),
  agent: require('../../assets/avatars/agent.png'),
  gamer: require('../../assets/avatars/gamer.png'),
  ovni: require('../../assets/avatars/ovni.png'),
};

export const CAPY_AVATARS = Object.keys(CAPY_IMAGES).map((name) => `${CAPY_PREFIX}${name}`);

export const EMOJI_AVATARS = ['🦫', '🐹', '🦦', '🐻', '🦊', '🐼', '🐨', '🐸', '🐵', '🦁', '🐯', '🐰', '🐧', '🦉', '🐢', '🦄', '🐙', '🐞'];

export const AVATAR_COLORS = ['#E8C7A0', '#F4B6A6', '#F7D88C', '#BFDDB0', '#A9D3E0', '#C9B8E8', '#F2B8D0', '#D6D0C4'];

/** Image d'un avatar illustré, `undefined` pour un emoji */
export function avatarImage(avatar: string): ImageSourcePropType | undefined {
  return avatar.startsWith(CAPY_PREFIX) ? CAPY_IMAGES[avatar.slice(CAPY_PREFIX.length)] : undefined;
}

export function randomAvatar(): { avatar: string; color: string } {
  return {
    avatar: CAPY_AVATARS[Math.floor(Math.random() * CAPY_AVATARS.length)],
    color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
  };
}
