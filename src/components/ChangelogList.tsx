import { StyleSheet, Text, View } from 'react-native';
import { formatChangelogDate, type ChangelogEntry } from '@/data/changelog';
import { colors, common } from '@/theme';

/** Liste de nouveautés, partagée par la fenêtre de lancement et l'historique */
export function ChangelogList({ entries }: { entries: ChangelogEntry[] }) {
  return (
    <>
      {entries.map((entry) => (
        <View key={entry.id} style={styles.entry}>
          <Text style={styles.title}>{entry.title}</Text>
          <Text style={common.subtitle}>{formatChangelogDate(entry.date)}</Text>
          {entry.items.map((item) => (
            <Text key={item} style={styles.item}>
              {item}
            </Text>
          ))}
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  entry: { gap: 4 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  item: { fontSize: 15, lineHeight: 22, color: colors.text, marginTop: 2 },
});
