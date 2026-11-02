import { StyleSheet } from 'react-native';

export const colors = {
  background: '#F6F3EE',
  card: '#FFFFFF',
  text: '#1F1B16',
  muted: '#7A7167',
  border: '#E4DDD3',
  primary: '#C2502E',
  primaryText: '#FFFFFF',
  success: '#2E7D4F',
  danger: '#B3261E',
};

export const common = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', marginTop: 8 },
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
});
