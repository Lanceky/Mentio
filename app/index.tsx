import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MentioScene } from '@/components/mentio/MentioScene';
import { AGE_BANDS, Mentio, type AgeBand } from '@/constants/theme';
import { topicsForAge } from '@/constants/topics';
import { usePreferences } from '@/providers/preferences';

const ORDER: AgeBand[] = ['kid', 'teen', 'mature'];

export default function Onboarding() {
  const router = useRouter();
  const { prefs, update } = usePreferences();

  const [name, setName] = useState(prefs.name);
  const [age, setAge] = useState<AgeBand>(prefs.age);
  const [topicId, setTopicId] = useState(prefs.topicId);

  const band = AGE_BANDS[age];
  const subjects = topicsForAge(age);

  // Subjects vary by age, so switch to that age's list and reset the choice.
  const pickAge = (a: AgeBand) => {
    setAge(a);
    setTopicId(topicsForAge(a)[0].id);
  };

  // Ensure the selected subject is valid for the current age.
  const activeTopicId = subjects.some((t) => t.id === topicId) ? topicId : subjects[0].id;

  const start = () => {
    update({ name: name.trim(), age, topicId: activeTopicId, onboarded: true });
    router.push('/teach');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: band.bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.brand}>mentio</Text>
            <Text style={[styles.tagline, { color: band.accent }]}>
              the robot you get to teach
            </Text>
          </View>

          <View style={styles.heroScene}>
            <MentioScene mood="happy" age={age} style={styles.scene} />
          </View>

          {/* Name */}
          <Text style={styles.label}>What should Mentio call you?</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={Mentio.stone}
            returnKeyType="done"
            maxLength={24}
          />

          {/* Age */}
          <Text style={styles.label}>How old are you?</Text>
          <View style={styles.row}>
            {ORDER.map((a) => {
              const active = a === age;
              return (
                <Pressable
                  key={a}
                  onPress={() => pickAge(a)}
                  style={[
                    styles.choice,
                    styles.flex1,
                    active && { backgroundColor: band.accent, borderColor: Mentio.ink },
                  ]}>
                  <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
                    {AGE_BANDS[a].range.replace('Ages ', '')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Subject */}
          <Text style={styles.label}>Which subject will you teach Mentio?</Text>
          <View style={styles.topicGrid}>
            {subjects.map((t) => {
              const active = t.id === activeTopicId;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setTopicId(t.id)}
                  style={[
                    styles.topicCard,
                    active && { borderColor: band.accent, backgroundColor: Mentio.sand },
                  ]}>
                  <Text style={styles.topicTitle}>{t.title}</Text>
                  <Text style={styles.topicBlurb}>{t.blurb}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: Mentio.pine },
              pressed && styles.ctaPressed,
            ]}
            onPress={start}>
            <Text style={styles.ctaText}>Start teaching</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  flex1: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  header: {
    paddingTop: 8,
    alignItems: 'center',
  },
  brand: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 1,
    color: Mentio.ink,
  },
  tagline: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '600',
  },
  heroScene: {
    alignItems: 'center',
  },
  scene: {
    width: '70%',
    maxWidth: 260,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: Mentio.ink,
    marginTop: 18,
    marginBottom: 10,
  },
  input: {
    backgroundColor: Mentio.chalk,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Mentio.ink,
    borderWidth: 1,
    borderColor: Mentio.stone,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  choice: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: Mentio.chalk,
    borderWidth: 1,
    borderColor: Mentio.stone,
  },
  choiceText: {
    fontSize: 15,
    fontWeight: '700',
    color: Mentio.inkSoft,
  },
  choiceTextActive: {
    color: Mentio.chalk,
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  topicCard: {
    width: '48%',
    backgroundColor: Mentio.chalk,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Mentio.stone,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Mentio.ink,
  },
  topicBlurb: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 17,
    color: Mentio.inkSoft,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  cta: {
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: Mentio.pineDeep,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  ctaPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  ctaText: {
    color: Mentio.chalk,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
