import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { AVATAR_COLORS, CAPY_AVATARS, EMOJI_AVATARS } from '@/data/avatars';
import type { PlayerInput } from '@/store/players';
import { colors, common } from '@/theme';

type Props = {
  initial: PlayerInput;
  submitLabel: string;
  onSubmit: (input: PlayerInput) => void;
};

export function PlayerForm({ initial, submitLabel, onSubmit }: Props) {
  const [name, setName] = useState(initial.name);
  const [avatar, setAvatar] = useState(initial.avatar);
  const [color, setColor] = useState(initial.color);

  return (
    <View style={styles.form}>
      <View style={styles.preview}>
        <Avatar avatar={avatar} color={color} size={88} />
      </View>

      <Text style={common.sectionTitle}>Nom</Text>
      <TextInput
        style={common.input}
        placeholder="Nom du joueur"
        placeholderTextColor={colors.muted}
        value={name}
        autoCapitalize="words"
        onChangeText={setName}
      />

      <Text style={common.sectionTitle}>Avatar</Text>
      <View style={styles.grid}>
        {CAPY_AVATARS.map((value) => (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityLabel={`Capybara ${value.split(':')[1]}`}
            accessibilityState={{ selected: value === avatar }}
            onPress={() => setAvatar(value)}
            style={[styles.capyOption, value === avatar && styles.selected]}
          >
            <Avatar avatar={value} color={color} size={52} />
          </Pressable>
        ))}
      </View>
      <Text style={styles.subLabel}>Ou un emoji</Text>
      <View style={styles.grid}>
        {EMOJI_AVATARS.map((value) => (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ selected: value === avatar }}
            onPress={() => setAvatar(value)}
            style={[styles.option, value === avatar && styles.selected]}
          >
            <Text style={styles.emoji}>{value}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={common.sectionTitle}>Couleur</Text>
      <View style={styles.grid}>
        {AVATAR_COLORS.map((value) => (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityLabel={`Couleur ${value}`}
            accessibilityState={{ selected: value === color }}
            onPress={() => setColor(value)}
            style={[styles.option, { backgroundColor: value }, value === color && styles.selected]}
          />
        ))}
      </View>

      <Button label={submitLabel} disabled={!name.trim()} onPress={() => onSubmit({ name: name.trim(), avatar, color })} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 10 },
  preview: { alignItems: 'center', paddingVertical: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  capyOption: { borderRadius: 30, borderWidth: 3, borderColor: 'transparent', padding: 1 },
  selected: { borderColor: colors.primary },
  subLabel: { fontSize: 12, color: colors.muted },
  emoji: { fontSize: 24 },
});
