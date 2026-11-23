import { ScrollView, View } from 'react-native';
import { ChangelogList } from '@/components/ChangelogList';
import { CHANGELOG } from '@/data/changelog';
import { useContentStyle } from '@/hooks/useContentStyle';
import { common } from '@/theme';

/** Historique complet des nouveautés */
export default function WhatsNewScreen() {
  const contentStyle = useContentStyle();
  return (
    <ScrollView style={common.screen} contentContainerStyle={contentStyle}>
      {CHANGELOG.map((entry) => (
        <View key={entry.id} style={common.card}>
          <ChangelogList entries={[entry]} />
        </View>
      ))}
    </ScrollView>
  );
}
