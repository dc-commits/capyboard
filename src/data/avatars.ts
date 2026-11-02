// Pas d'emoji capybara en Unicode : le castor 🦫 fait office de mascotte
export const AVATARS = ['🦫', '🐹', '🦦', '🐻', '🦊', '🐼', '🐨', '🐸', '🐵', '🦁', '🐯', '🐰', '🐧', '🦉', '🐢', '🦄', '🐙', '🐞'];

export const AVATAR_COLORS = ['#E8C7A0', '#F4B6A6', '#F7D88C', '#BFDDB0', '#A9D3E0', '#C9B8E8', '#F2B8D0', '#D6D0C4'];

export function randomAvatar(): { avatar: string; color: string } {
  return {
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
  };
}
