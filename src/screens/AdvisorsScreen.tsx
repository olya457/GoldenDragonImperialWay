// AdvisorsScreen.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Animated,
  Easing,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import type { MainTabParamList } from '../navigation/types';

type Props = BottomTabScreenProps<MainTabParamList, 'Advisors'>;

const BG = require('../assets/bg.png');
const HEADER_IMG = require('../assets/onboard1.png');

const AV_LEFT = require('../assets/avatar_left.png');
const AV_RIGHT = require('../assets/avatar_right.png');

const IC_BACK = require('../assets/ic_back.png');
const IC_SHARE = require('../assets/ic_share.png');

const IMG_WISE = require('../assets/advisor_wise.png');
const IMG_MILITARY = require('../assets/advisor_military.png');
const IMG_PEASANTS = require('../assets/advisor_peasants.png');

const KEY_CHARACTER = 'selected_character_v1';

// ✅ persist last opened page/state
const KEY_ADVISORS_STATE = 'advisors_state_v1';

type Step = 'pickAdvisor' | 'pickQuestion' | 'waiting' | 'answer';
type AdvisorId = 'wise' | 'military' | 'peasants';

type Advisor = {
  id: AdvisorId;
  title: string;
  subtitle: string;
  image: any;
  questions: string[];
  answers: string[];
};

type PersistedState = {
  step: Step;
  advisorId: AdvisorId;
  advisorPickedOnce: boolean;
  question: string;
  answer: string;
};

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

const GOLD = '#f5d37a';

export default function AdvisorsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmallH = height <= 700;
  const isTinyH = height <= 640;

  const cardW = Math.min(430, width - 26);

  const topPad = insets.top;
  const bottomPad = insets.bottom;

  const gap = isTinyH ? 8 : isSmallH ? 10 : 12;
  const headerH = isTinyH ? 76 : isSmallH ? 86 : 94;

  // ✅ requested: move ALL content UP by 20px reliably
  const CONTENT_SHIFT_Y = -20;

  const [selectedCharacter, setSelectedCharacter] = useState<'empress' | 'emperor'>('empress');
  const chosenAvatar = selectedCharacter === 'empress' ? AV_LEFT : AV_RIGHT;

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(KEY_CHARACTER);
        if (v === 'empress' || v === 'emperor') setSelectedCharacter(v);
      } catch {}
    })();
  }, []);

  const dateStr = useMemo(() => {
    const d = new Date();
    return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
  }, []);

  const ADVISORS: Advisor[] = useMemo(
    () => [
      {
        id: 'wise',
        title: 'Wise Advisors',
        subtitle: 'For complex decisions and deep questions. The style is calm, philosophical.',
        image: IMG_WISE,
        questions: [
          'How do I make the right decision in a difficult situation?',
          'How do I maintain inner peace in times of anxiety?',
          'What is my true strength and calling?',
          'How do I act wisely when emotions interfere with reason?',
        ],
        answers: [
          'Think about the long-term consequences, not the immediate benefits.',
          'Breathe slowly, focus on what you can control, and let the rest pass.',
          'Your strength is consistency: small steps repeated daily build real power.',
          'Pause, name the emotion, then choose one action aligned with your values.',
        ],
      },
      {
        id: 'military',
        title: 'Military Advisors',
        subtitle: 'For action, discipline and determination. Style is direct and strict.',
        image: IMG_MILITARY,
        questions: [
          'How do I stop procrastinating today?',
          'How do I build discipline when motivation is low?',
          'What should I focus on first when everything feels urgent?',
          'How do I recover after a setback?',
        ],
        answers: [
          'Start with a 10-minute sprint. No planning. Just move.',
          'Make it smaller. Commit to the minimum. Win the first battle.',
          'Choose one objective. Remove distractions. Execute step by step.',
          'Review what happened, adjust your plan, and return to the mission.',
        ],
      },
      {
        id: 'peasants',
        title: 'Advisors of the peasants',
        subtitle: 'For everyday life and relationships. Style is simple and practical.',
        image: IMG_PEASANTS,
        questions: [
          'How do I reduce stress in a busy day?',
          'How do I improve relationships without arguments?',
          'How do I keep my home and mind organized?',
          'How do I feel better when I have no energy?',
        ],
        answers: [
          'Do one small thing fully, then take a short break. Repeat.',
          'Speak in “I feel / I need” sentences and listen without interrupting.',
          'Clear one surface. One shelf. One corner. Progress is visible.',
          'Drink water, stretch for 3 minutes, and step outside for fresh air.',
        ],
      },
    ],
    []
  );

  const [step, setStep] = useState<Step>('pickAdvisor');
  const [advisorId, setAdvisorId] = useState<AdvisorId>('wise');
  const advisor = useMemo(() => ADVISORS.find((a) => a.id === advisorId)!, [ADVISORS, advisorId]);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  // ✅ "Choose" appears only after user taps an advisor card
  const [advisorPickedOnce, setAdvisorPickedOnce] = useState(false);

  // ✅ restore last page when coming back
  const restoringRef = useRef(false);

  const restoreState = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY_ADVISORS_STATE);
      if (!raw) return;
      const s = JSON.parse(raw) as PersistedState;

      if (!s || !s.step || !s.advisorId) return;

      restoringRef.current = true;
      setStep(s.step);
      setAdvisorId(s.advisorId);
      setAdvisorPickedOnce(!!s.advisorPickedOnce);
      setQuestion(s.question || '');
      setAnswer(s.answer || '');
      setTimeout(() => {
        restoringRef.current = false;
      }, 0);
    } catch {}
  }, []);

  const persistState = useCallback(
    async (next?: Partial<PersistedState>) => {
      try {
        const payload: PersistedState = {
          step,
          advisorId,
          advisorPickedOnce,
          question,
          answer,
          ...(next ?? {}),
        };
        await AsyncStorage.setItem(KEY_ADVISORS_STATE, JSON.stringify(payload));
      } catch {}
    },
    [step, advisorId, advisorPickedOnce, question, answer]
  );

  useFocusEffect(
    useCallback(() => {
      restoreState();
      return () => {};
    }, [restoreState])
  );

  // Persist on any changes (but don’t fight restore)
  useEffect(() => {
    if (restoringRef.current) return;
    persistState();
  }, [step, advisorId, advisorPickedOnce, question, answer, persistState]);

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [step, advisorId, anim]);

  const fade = anim;
  const y = anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.992, 1] });

  const headerTitle = 'Welcome to Golden\nDragon Imperial Way';

  const pickAdvisor = (id: AdvisorId) => {
    setAdvisorId(id);
    setAdvisorPickedOnce(true);
    persistState({ advisorId: id, advisorPickedOnce: true });
  };

  const onChooseAdvisor = () => {
    setQuestion('');
    setAnswer('');
    setStep('pickQuestion');
    persistState({ step: 'pickQuestion', question: '', answer: '' });
  };

  const onPickQuestion = (q: string) => {
    setQuestion(q);
    setAnswer('');
    setStep('waiting');
    persistState({ step: 'waiting', question: q, answer: '' });

    const idx = Math.floor(Math.random() * advisor.answers.length);
    const a = advisor.answers[idx];

    setTimeout(() => {
      setAnswer(a);
      setStep('answer');
      persistState({ step: 'answer', answer: a });
    }, 900);
  };

  const onTryAgain = () => {
    setQuestion('');
    setAnswer('');
    setStep('pickQuestion');
    persistState({ step: 'pickQuestion', question: '', answer: '' });
  };

  const onShare = async () => {
    try {
      const msg = question && answer ? `${advisor.title}\n\nQ: ${question}\n\nA: ${answer}` : `${advisor.title}`;
      await Share.share({ message: msg });
    } catch {}
  };

  // ✅ adaptive sizes + button placement
  const chooseBtnH = isTinyH ? 50 : isSmallH ? 54 : 56;

  // ✅ requested: Choice button UP by 20px (relative to previous)
  const chooseBtnTop = (isTinyH ? 8 : 10) - 20; // lift button

  const advisorCardImg = isTinyH ? 70 : 78;
  const advisorCardPad = isTinyH ? 10 : 12;

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView
        style={{
          flex: 1,
          paddingTop: topPad,
          paddingBottom: bottomPad,
        }}
      >
        {/* ✅ shift everything up by 20px */}
        <View style={[styles.stage, { transform: [{ translateY: CONTENT_SHIFT_Y }] }]}>
          <View style={[styles.headerCard, { width: cardW, height: headerH, marginBottom: gap }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerThumbWrap, isTinyH && { width: 52, height: 52 }]}>
                <Image source={HEADER_IMG} style={styles.headerThumb} resizeMode="cover" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { fontSize: isTinyH ? 15 : 16 }]}>{headerTitle}</Text>
                <Text style={[styles.headerDate, { fontSize: isTinyH ? 11 : 12 }]}>{dateStr}</Text>
              </View>
            </View>
            <View style={styles.headerDot} />
          </View>

          <Animated.View
            style={[
              {
                width: cardW,
                flex: 1,
                opacity: fade,
                transform: [{ translateY: y }, { scale }],
              },
            ]}
          >
            {step === 'pickAdvisor' ? (
              <View style={{ flex: 1 }}>
                <View style={[styles.guideCard, { marginBottom: gap }]}>
                  <View style={styles.guideRow}>
                    <View style={[styles.guideAvatarWrap, isTinyH && { width: 62, height: 62 }]}>
                      {/* ✅ never crop avatar */}
                      <Image source={chosenAvatar} style={styles.guideAvatar} resizeMode="contain" />
                    </View>
                    <Text style={[styles.guideText, isTinyH && { fontSize: 13 }]} numberOfLines={2}>
                      Choose your advisors
                    </Text>
                  </View>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: isTinyH ? 6 : 10 }}
                >
                  {ADVISORS.map((a) => {
                    const active = a.id === advisorId;
                    return (
                      <Pressable
                        key={a.id}
                        onPress={() => pickAdvisor(a.id)}
                        style={({ pressed }) => [
                          styles.advisorCard,
                          { padding: advisorCardPad },
                          active && styles.advisorCardActive,
                          pressed && { transform: [{ scale: 0.99 }] },
                        ]}
                      >
                        <View style={[styles.advisorLeftImgWrap, { width: advisorCardImg, height: advisorCardImg }]}>
                          <Image source={a.image} style={styles.advisorLeftImg} resizeMode="cover" />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={[styles.advisorTitle, isTinyH && { fontSize: 17 }]} numberOfLines={1}>
                            {a.title}
                          </Text>
                          <Text style={[styles.advisorSub, isTinyH && { fontSize: 12 }]} numberOfLines={3}>
                            {a.subtitle}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* ✅ show only after pick + lifted 20px */}
                {advisorPickedOnce && (
                  <Pressable
                    onPress={onChooseAdvisor}
                    style={({ pressed }) => [
                      styles.chooseBig,
                      { height: chooseBtnH, marginTop: chooseBtnTop },
                      pressed && { transform: [{ scale: 0.99 }] },
                    ]}
                  >
                    <Text style={[styles.chooseBigText, isTinyH && { fontSize: 17 }]}>Choose</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: gap }}>
                  <Pressable
                    onPress={() => {
                      setStep('pickAdvisor');
                      persistState({ step: 'pickAdvisor' });
                    }}
                    style={({ pressed }) => [styles.backBtn, pressed && { transform: [{ scale: 0.98 }] }]}
                  >
                    <Image source={IC_BACK} style={styles.backIcon} resizeMode="contain" />
                  </Pressable>

                  <View style={[styles.selectedAdvisorCard, { flex: 1 }]}>
                    <View style={styles.selectedAdvisorImgWrap}>
                      <Image source={advisor.image} style={styles.selectedAdvisorImg} resizeMode="cover" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedAdvisorTitle} numberOfLines={1}>
                        {advisor.title}
                      </Text>
                      <Text style={styles.selectedAdvisorSub} numberOfLines={2}>
                        {advisor.subtitle}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.promptCard, { marginBottom: gap }]}>
                  <Text style={[styles.promptText, isTinyH && { fontSize: 12 }]} numberOfLines={1}>
                    What are you interested in today?
                  </Text>

                  <View style={styles.promptRightImgWrap}>
                    <Image source={advisor.image} style={styles.promptRightImg} resizeMode="cover" />
                  </View>
                </View>

                {step === 'pickQuestion' ? (
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: gap }}>
                    {advisor.questions.map((q) => (
                      <Pressable
                        key={q}
                        onPress={() => onPickQuestion(q)}
                        style={({ pressed }) => [styles.questionPill, pressed && { transform: [{ scale: 0.99 }] }]}
                      >
                        <View style={styles.qAvatarWrap}>
                          <Image source={chosenAvatar} style={styles.qAvatarImg} resizeMode="contain" />
                        </View>
                        <Text style={[styles.questionText, isTinyH && { fontSize: 12 }]} numberOfLines={2}>
                          {q}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : step === 'waiting' ? (
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={[styles.waitCard, isTinyH && { height: 78 }]}>
                      <Text style={[styles.waitText, isTinyH && { fontSize: 16 }]}>Wait for the answer...</Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ flex: 1 }}>
                    <View style={[styles.bubble, { marginBottom: 10 }]}>
                      <View style={styles.bubbleLeft}>
                        <View style={styles.qAvatarWrapSmall}>
                          <Image source={chosenAvatar} style={styles.qAvatarImgSmall} resizeMode="contain" />
                        </View>
                      </View>
                      <Text style={[styles.bubbleText, isTinyH && { fontSize: 12 }]} numberOfLines={3}>
                        {question}
                      </Text>
                    </View>

                    <View style={[styles.bubble, { marginBottom: 16, alignSelf: 'flex-end' }]}>
                      <Text style={[styles.bubbleText, isTinyH && { fontSize: 12 }]} numberOfLines={4}>
                        {answer}
                      </Text>
                      <View style={styles.bubbleRight}>
                        <View style={styles.promptRightImgWrapSm}>
                          <Image source={advisor.image} style={styles.promptRightImgSm} resizeMode="cover" />
                        </View>
                      </View>
                    </View>

                    <Pressable
                      onPress={onShare}
                      style={({ pressed }) => [
                        styles.goldBtn,
                        { height: isTinyH ? 50 : 52 },
                        pressed && { transform: [{ scale: 0.99 }] },
                      ]}
                    >
                      <Image source={IC_SHARE} style={styles.goldIcon} resizeMode="contain" />
                      <Text style={[styles.goldBtnText, isTinyH && { fontSize: 17 }]}>Share</Text>
                    </Pressable>

                    <Pressable
                      onPress={onTryAgain}
                      style={({ pressed }) => [
                        styles.goldBtn,
                        { marginTop: isTinyH ? 10 : 12, height: isTinyH ? 50 : 52 },
                        pressed && { transform: [{ scale: 0.99 }] },
                      ]}
                    >
                      <Text style={[styles.goldBtnText, isTinyH && { fontSize: 17 }]}>Try again</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </Animated.View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },

  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  headerCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(40,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },

  headerLeft: { flexDirection: 'row', alignItems: 'center' },

  headerThumbWrap: {
    width: 58,
    height: 58,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 10,
  },
  headerThumb: { width: '100%', height: '100%' },

  headerTitle: { color: '#fff', fontWeight: '900', lineHeight: 18 },
  headerDate: { marginTop: 4, color: 'rgba(255,255,255,0.65)', fontWeight: '700' },

  headerDot: {
    position: 'absolute',
    right: 12,
    top: 14,
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: '#24d35a',
  },

  guideCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(40,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  guideRow: { flexDirection: 'row', alignItems: 'center' },

  guideAvatarWrap: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: 'rgba(120,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    padding: 6,
    overflow: 'hidden',
  },
  guideAvatar: { width: '100%', height: '100%' },

  guideText: {
    flex: 1,
    color: 'rgba(255,255,255,0.90)',
    fontWeight: '800',
    fontSize: 14,
  },

  advisorCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(120,0,0,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.22)',
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },

  advisorCardActive: {
    borderColor: 'rgba(245,211,122,0.65)',
    backgroundColor: 'rgba(140,0,0,0.68)',
  },

  advisorLeftImgWrap: {
    width: 78,
    height: 78,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.35)',
  },
  advisorLeftImg: { width: '100%', height: '100%' },

  advisorTitle: { color: GOLD, fontWeight: '900', fontSize: 18, marginBottom: 4 },
  advisorSub: { color: 'rgba(255,255,255,0.82)', fontWeight: '700', lineHeight: 18, fontSize: 13 },

  chooseBig: {
    marginTop: 10,
    height: 56,
    borderRadius: 999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseBigText: { color: '#2b1200', fontWeight: '900', fontSize: 18 },

  backBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(120,0,0,0.70)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  backIcon: { width: 22, height: 22 },

  selectedAdvisorCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(120,0,0,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
    padding: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  selectedAdvisorImgWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  selectedAdvisorImg: { width: '100%', height: '100%' },
  selectedAdvisorTitle: { color: GOLD, fontWeight: '900', fontSize: 14 },
  selectedAdvisorSub: { marginTop: 2, color: 'rgba(255,255,255,0.78)', fontWeight: '700', fontSize: 12, lineHeight: 16 },

  promptCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(40,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promptText: { color: 'rgba(255,255,255,0.82)', fontWeight: '800', fontSize: 13 },

  promptRightImgWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.35)',
  },
  promptRightImg: { width: '100%', height: '100%' },

  questionPill: {
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: 'rgba(120,0,0,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },

  qAvatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    overflow: 'hidden',
  },
  qAvatarImg: { width: '100%', height: '100%' },

  questionText: { flex: 1, color: 'rgba(255,255,255,0.90)', fontWeight: '800', fontSize: 13, lineHeight: 18 },

  waitCard: {
    height: 86,
    borderRadius: 18,
    backgroundColor: 'rgba(120,0,0,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitText: { color: 'rgba(255,255,255,0.92)', fontWeight: '900', fontSize: 18 },

  bubble: {
    maxWidth: '92%',
    borderRadius: 18,
    backgroundColor: 'rgba(40,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bubbleText: { flex: 1, color: 'rgba(255,255,255,0.88)', fontWeight: '800', fontSize: 13, lineHeight: 18 },

  bubbleLeft: { justifyContent: 'center' },
  qAvatarWrapSmall: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    overflow: 'hidden',
  },
  qAvatarImgSmall: { width: '100%', height: '100%' },

  bubbleRight: { justifyContent: 'center' },
  promptRightImgWrapSm: {
    width: 34,
    height: 34,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.35)',
  },
  promptRightImgSm: { width: '100%', height: '100%' },

  goldBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  goldIcon: { width: 18, height: 18 },
  goldBtnText: { color: '#2b1200', fontWeight: '900', fontSize: 18 },
});