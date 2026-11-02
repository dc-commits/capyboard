import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { DetailedRoundEntry, formatDetail, parseDetail, type DetailDraft } from '@/components/DetailedRoundEntry';
import { getGame } from '@/data/games';
import { usePlayers } from '@/store/players';
import { getEndReason, getProgress, getTieBreakerTotals, getTotals, getWinners, useMatches } from '@/store/matches';
import { colors, common } from '@/theme';

export default function MatchScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { getPlayer } = usePlayers();
  const { matches, addRound, removeRound, finishMatch, resumeMatch, deleteMatch } = useMatches();
  const match = matches.find((candidate) => candidate.id === matchId);
  const game = match ? getGame(match.gameId) : undefined;
  const [draft, setDraft] = useState<string[]>([]);
  const [detailDraft, setDetailDraft] = useState<DetailDraft>([]);

  if (!match || !game) return <Text style={common.content}>Partie introuvable</Text>;

  const totals = getTotals(match);
  const { leaders, decidedBy } = getWinners(match, game);
  const { scoring } = game;

  // Saisie simple : un score par joueur
  const values = match.players.map((_, index) => draft[index] ?? '');
  const parsed = values.map((value) => Number(value.replace(',', '.')));
  const canAddSimple = values.every((value) => value.trim() !== '') && parsed.every((value) => Number.isFinite(value));

  // Saisie détaillée : plusieurs champs par joueur, score calculé
  const details = scoring ? match.players.map((_, index) => parseDetail(scoring, detailDraft[index])) : [];
  const completeDetails = details.every((detail) => detail !== null) ? details.filter((detail) => detail !== null) : null;
  const detailedScores = scoring && completeDetails ? completeDetails.map((detail) => scoring.compute(detail, completeDetails)) : null;
  const computedScores = detailedScores?.every((score) => score !== null) ? detailedScores.filter((score) => score !== null) : null;

  const canAdd = scoring ? computedScores !== null : canAddSimple;

  const submitRound = () => {
    if (scoring) {
      if (!completeDetails || !computedScores) return;
      addRound(match.id, { scores: computedScores, details: completeDetails }, game.endCondition);
      setDetailDraft([]);
    } else {
      addRound(match.id, { scores: parsed }, game.endCondition);
      setDraft([]);
    }
  };

  const confirmRemoveRound = (roundIndex: number) =>
    Alert.alert(`Supprimer la manche ${roundIndex + 1} ?`, undefined, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeRound(match.id, roundIndex) },
    ]);

  const confirmDelete = () =>
    Alert.alert('Supprimer la partie ?', 'Les scores seront perdus.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          router.back();
          deleteMatch(match.id);
        },
      },
    ]);

  return (
    <KeyboardAvoidingView style={common.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: `${game.emoji} ${game.name}` }} />
      <ScrollView contentContainerStyle={common.content} keyboardShouldPersistTaps="handled">
        {!match.finishedAt && <Text style={styles.progress}>{getProgress(match, game)}</Text>}
        <View style={common.card}>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.roundCell, styles.head]}>#</Text>
            {match.players.map((player, index) => {
              const profile = match.playerIds && getPlayer(match.playerIds[index]);
              return (
                <View key={index} style={[styles.cell, styles.headCell]}>
                  {profile && <Avatar avatar={profile.avatar} color={profile.color} size={28} />}
                  <Text style={styles.head} numberOfLines={1}>
                    {player}
                  </Text>
                </View>
              );
            })}
          </View>

          {match.rounds.map((round, roundIndex) => (
            <View key={roundIndex} style={[styles.row, styles.roundRow]}>
              <Text style={[styles.cell, styles.roundCell, styles.muted]} onLongPress={() => confirmRemoveRound(roundIndex)}>
                {roundIndex + 1}
              </Text>
              {round.map((score, playerIndex) => {
                const detail = match.details?.[roundIndex]?.[playerIndex];
                return (
                  <Text key={playerIndex} style={styles.cell} onLongPress={() => confirmRemoveRound(roundIndex)}>
                    {score}
                    {scoring && detail && <Text style={styles.detail}>{'\n' + formatDetail(scoring, detail)}</Text>}
                  </Text>
                );
              })}
            </View>
          ))}

          {!match.finishedAt && !scoring && (
            <View style={[styles.row, styles.roundRow]}>
              <Text style={[styles.cell, styles.roundCell, styles.muted]}>{match.rounds.length + 1}</Text>
              {values.map((value, index) => (
                <TextInput
                  key={index}
                  style={[common.input, styles.cell, styles.scoreInput]}
                  value={value}
                  keyboardType="numbers-and-punctuation"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  onChangeText={(text) => setDraft(() => values.map((current, i) => (i === index ? text : current)))}
                  onSubmitEditing={() => canAdd && submitRound()}
                />
              ))}
            </View>
          )}

          <View style={[styles.row, styles.totalRow]}>
            <Text style={[styles.cell, styles.roundCell, styles.head]}>Σ</Text>
            {totals.map((total, index) => (
              <Text key={index} style={[styles.cell, styles.total, leaders.includes(index) && styles.leader]}>
                {leaders.includes(index) ? '🏆 ' : ''}
                {total}
              </Text>
            ))}
          </View>

          {scoring && scoring.tieBreakers.length > 0 && match.details && match.details.length > 0 && (
            <View style={styles.row}>
              <Text style={[styles.cell, styles.roundCell]} />
              {match.players.map((_, playerIndex) => (
                <Text key={playerIndex} style={[styles.cell, styles.detail]}>
                  {scoring.tieBreakers
                    .map((tieBreaker) => `${tieBreaker.icon}${getTieBreakerTotals(match, tieBreaker)[playerIndex]}${tieBreaker.unit ?? ''}`)
                    .join(' ')}
                </Text>
              ))}
            </View>
          )}
        </View>

        {scoring && !match.finishedAt && (
          <DetailedRoundEntry
            scoring={scoring}
            players={match.players}
            roundNumber={match.rounds.length + 1}
            draft={detailDraft}
            onChange={setDetailDraft}
          />
        )}

        {match.rounds.length > 0 && <Text style={styles.hint}>Appui long sur une manche pour la supprimer.</Text>}

        {!match.finishedAt ? (
          <>
            <Button label="Valider la manche" disabled={!canAdd} onPress={submitRound} />
            <Button
              label="Terminer la partie"
              variant="secondary"
              disabled={match.rounds.length === 0}
              onPress={() => finishMatch(match.id)}
            />
          </>
        ) : (
          <View style={[common.card, styles.result]}>
            <Text style={common.title}>
              🏆 {leaders.map((index) => match.players[index]).join(' & ')} {leaders.length > 1 ? 'gagnent' : 'gagne'} !
            </Text>
            {decidedBy && <Text style={common.subtitle}>Égalité départagée par {decidedBy}</Text>}
            <Text style={common.subtitle}>{getEndReason(match, game)}</Text>
          </View>
        )}
        {match.finishedAt && <Button label="Reprendre la partie" variant="secondary" onPress={() => resumeMatch(match.id)} />}
        <Button label="Supprimer la partie" variant="danger" onPress={confirmDelete} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roundRow: { paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  totalRow: { paddingTop: 10, marginTop: 4, borderTopWidth: 2, borderTopColor: colors.text },
  cell: { flex: 1, textAlign: 'center', fontSize: 16, color: colors.text },
  roundCell: { flex: 0, width: 28 },
  head: { fontWeight: '700', paddingBottom: 6, fontSize: 16, color: colors.text },
  headCell: { alignItems: 'center', gap: 4 },
  muted: { color: colors.muted },
  scoreInput: { minWidth: 0, paddingHorizontal: 4, paddingVertical: 8 },
  total: { fontWeight: '700', fontSize: 18 },
  detail: { fontSize: 11, fontWeight: '400', color: colors.muted },
  leader: { color: colors.success },
  progress: { fontSize: 14, fontWeight: '600', color: colors.primary, textAlign: 'center' },
  hint: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  result: { alignItems: 'center', gap: 4 },
});
