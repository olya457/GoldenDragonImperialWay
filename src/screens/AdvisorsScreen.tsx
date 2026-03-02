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
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
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

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

const GOLD = '#f5d37a';

export default function AdvisorsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const tabBarH = useBottomTabBarHeight();
  const { width, height } = useWindowDimensions();

  const isSmallH = height <= 700;
  const isTinyH = height <= 640;

  const cardW = Math.min(430, width - 26);

  const topPad = insets.top;
  const bottomPad = insets.bottom;

  const gap = isTinyH ? 6 : isSmallH ? 8 : 12;
  const headerH = isTinyH ? 66 : isSmallH ? 78 : 94;

  const CONTENT_SHIFT_Y = isTinyH ? -10 : isSmallH ? -12 : -20;

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

  const [advisorPickedOnce, setAdvisorPickedOnce] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setStep('pickAdvisor');
      setAdvisorId('wise');
      setAdvisorPickedOnce(false);
      setQuestion('');
      setAnswer('');
      return undefined;
    }, [])
  );

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
  const y = anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.993, 1] });

  const headerTitle = 'Welcome to Golden\nDragon Imperial Way';

  const pickAdvisor = (id: AdvisorId) => {
    setAdvisorId(id);
    setAdvisorPickedOnce(true);
  };

  const onChooseAdvisor = () => {
    setQuestion('');
    setAnswer('');
    setStep('pickQuestion');
  };

  const onPickQuestion = (q: string) => {
    setQuestion(q);
    setAnswer('');
    setStep('waiting');

    const idx = Math.floor(Math.random() * advisor.answers.length);
    const a = advisor.answers[idx];

    setTimeout(() => {
      setAnswer(a);
      setStep('answer');
    }, 900);
  };

  const onTryAgain = () => {
    setQuestion('');
    setAnswer('');
    setStep('pickQuestion');
  };

  const onShare = async () => {
    try {
      const msg = question && answer ? `${advisor.title}\n\nQ: ${question}\n\nA: ${answer}` : `${advisor.title}`;
      await Share.share({ message: msg });
    } catch {}
  };

  const chooseBtnH = isTinyH ? 48 : isSmallH ? 52 : 56;

  const headerThumbSize = isTinyH ? 48 : isSmallH ? 52 : 58;

  const guideAvatarSize = isTinyH ? 56 : isSmallH ? 60 : 70;

  const advisorCardImg = isTinyH ? 58 : isSmallH ? 64 : 78;
  const advisorCardPad = isTinyH ? 9 : isSmallH ? 10 : 12;

  const advisorTitleSize = isTinyH ? 16.5 : isSmallH ? 17 : 18;
  const advisorSubSize = isTinyH ? 11.5 : isSmallH ? 12 : 13;

  const headerFont = isTinyH ? 14 : 16;
  const dateFont = isTinyH ? 10.5 : 12;

  const bottomScrollPad = Math.max(0, tabBarH - bottomPad) + (isTinyH ? 10 : 12);

  const androidDown = Platform.OS === 'android' ? 20 : 0;

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={{ flex: 1, paddingTop: topPad, paddingBottom: bottomPad }}>
        <View style={[styles.stage, { transform: [{ translateY: CONTENT_SHIFT_Y + androidDown }] }]}>
          <View style={[styles.headerCard, { width: cardW, height: headerH, marginBottom: gap }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerThumbWrap, { width: headerThumbSize, height: headerThumbSize }]}>
                <Image source={HEADER_IMG} style={styles.headerThumb} resizeMode="cover" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { fontSize: headerFont }]}>{headerTitle}</Text>
                <Text style={[styles.headerDate, { fontSize: dateFont }]}>{dateStr}</Text>
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
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingBottom: bottomScrollPad,
                }}
              >
                <View style={[styles.guideCard, { marginBottom: gap, paddingVertical: isTinyH ? 10 : 12 }]}>
                  <View style={styles.guideRow}>
                    <View style={[styles.guideAvatarWrap, { width: guideAvatarSize, height: guideAvatarSize }]}>
                      <Image source={chosenAvatar} style={styles.guideAvatar} resizeMode="contain" />
                    </View>

                    <Text style={[styles.guideText, { fontSize: isTinyH ? 12.5 : 14 }]} numberOfLines={2}>
                      Choose your advisors
                    </Text>
                  </View>
                </View>

                {ADVISORS.map((a) => {
                  const active = a.id === advisorId;
                  return (
                    <Pressable
                      key={a.id}
                      onPress={() => pickAdvisor(a.id)}
                      style={({ pressed }) => [
                        styles.advisorCard,
                        { padding: advisorCardPad, marginBottom: isTinyH ? 10 : 12 },
                        active && styles.advisorCardActive,
                        pressed && { transform: [{ scale: 0.99 }] },
                      ]}
                    >
                      <View style={[styles.advisorLeftImgWrap, { width: advisorCardImg, height: advisorCardImg }]}>
                        <Image source={a.image} style={styles.advisorLeftImg} resizeMode="cover" />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={[styles.advisorTitle, { fontSize: advisorTitleSize }]} numberOfLines={1}>
                          {a.title}
                        </Text>
                        <Text
                          style={[
                            styles.advisorSub,
                            { fontSize: advisorSubSize, lineHeight: isTinyH ? 15.5 : 18 },
                          ]}
                          numberOfLines={3}
                        >
                          {a.subtitle}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}

                {advisorPickedOnce && (
                  <Pressable
                    onPress={onChooseAdvisor}
                    style={({ pressed }) => [
                      styles.chooseBig,
                      { height: chooseBtnH, marginTop: isTinyH ? 6 : 10, marginBottom: isTinyH ? 8 : 12 },
                      pressed && { transform: [{ scale: 0.99 }] },
                    ]}
                  >
                    <Text style={[styles.chooseBigText, isTinyH && { fontSize: 17 }]}>Choose</Text>
                  </Pressable>
                )}
              </ScrollView>
            ) : (
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: gap }}>
                  <Pressable
                    onPress={() => {
                      setStep('pickAdvisor');
                      setAdvisorPickedOnce(true);
                      setQuestion('');
                      setAnswer('');
                    }}
                    style={({ pressed }) => [
                      styles.backBtn,
                      isTinyH && { width: 50, height: 50, borderRadius: 16 },
                      pressed && { transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <Image
                      source={IC_BACK}
                      style={[styles.backIcon, isTinyH && { width: 20, height: 20 }]}
                      resizeMode="contain"
                    />
                  </Pressable>

                  <View style={[styles.selectedAdvisorCard, { flex: 1, padding: isTinyH ? 9 : 10 }]}>
                    <View style={[styles.selectedAdvisorImgWrap, isTinyH && { width: 48, height: 48 }]}>
                      <Image source={advisor.image} style={styles.selectedAdvisorImg} resizeMode="cover" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.selectedAdvisorTitle, isTinyH && { fontSize: 13 }]} numberOfLines={1}>
                        {advisor.title}
                      </Text>
                      <Text style={[styles.selectedAdvisorSub, isTinyH && { fontSize: 11 }]} numberOfLines={2}>
                        {advisor.subtitle}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.promptCard, { marginBottom: gap, paddingVertical: isTinyH ? 10 : 12 }]}>
                  <Text style={[styles.promptText, isTinyH && { fontSize: 12 }]} numberOfLines={1}>
                    What are you interested in today?
                  </Text>

                  <View style={[styles.promptRightImgWrap, isTinyH && { width: 40, height: 40 }]}>
                    <Image source={advisor.image} style={styles.promptRightImg} resizeMode="cover" />
                  </View>
                </View>

                {step === 'pickQuestion' ? (
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomScrollPad }}>
                    {advisor.questions.map((q) => (
                      <Pressable
                        key={q}
                        onPress={() => onPickQuestion(q)}
                        style={({ pressed }) => [
                          styles.questionPill,
                          isTinyH && { minHeight: 50, marginBottom: 10 },
                          pressed && { transform: [{ scale: 0.99 }] },
                        ]}
                      >
                        <View style={[styles.qAvatarWrap, isTinyH && { width: 40, height: 40, borderRadius: 14 }]}>
                          <Image source={chosenAvatar} style={styles.qAvatarImg} resizeMode="contain" />
                        </View>
                        <Text style={[styles.questionText, isTinyH && { fontSize: 12, lineHeight: 17 }]} numberOfLines={2}>
                          {q}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : step === 'waiting' ? (
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={[styles.waitCard, isTinyH && { height: 76 }]}>
                      <Text style={[styles.waitText, isTinyH && { fontSize: 16 }]}>Wait for the answer...</Text>
                    </View>
                  </View>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomScrollPad }}>
                    <View style={[styles.bubble, { marginBottom: isTinyH ? 8 : 10 }]}>
                      <View style={styles.bubbleLeft}>
                        <View style={styles.qAvatarWrapSmall}>
                          <Image source={chosenAvatar} style={styles.qAvatarImgSmall} resizeMode="contain" />
                        </View>
                      </View>
                      <Text style={[styles.bubbleText, isTinyH && { fontSize: 12, lineHeight: 17 }]} numberOfLines={3}>
                        {question}
                      </Text>
                    </View>

                    <View style={[styles.bubble, { marginBottom: isTinyH ? 12 : 16, alignSelf: 'flex-end' }]}>
                      <Text style={[styles.bubbleText, isTinyH && { fontSize: 12, lineHeight: 17 }]} numberOfLines={4}>
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
                  </ScrollView>
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
  selectedAdvisorSub: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
  },

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

  questionText: {
    flex: 1,
    color: 'rgba(255,255,255,0.90)',
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 18,
  },

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
  bubbleText: {
    flex: 1,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 18,
  },

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