import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Pressable,
  FlatList,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboard'>;

const BG = require('../assets/bg.png');

const IMG_1 = require('../assets/onboard1.png');
const IMG_2 = require('../assets/onboard2.png');
const IMG_3 = require('../assets/onboard3.png');
const IMG_4 = require('../assets/onboard4.png');

const AV_LEFT = require('../assets/avatar_left.png');
const AV_RIGHT = require('../assets/avatar_right.png');

type Slide = {
  key: string;
  image: any;
  bubbles: { side: 'left' | 'right'; text: string }[];
  cta: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function Bubble({
  side,
  text,
  maxWidth,
  compact,
}: {
  side: 'left' | 'right';
  text: string;
  maxWidth: number;
  compact: boolean;
}) {
  const isLeft = side === 'left';
  return (
    <View style={[styles.bubbleRow, isLeft ? { justifyContent: 'flex-start' } : { justifyContent: 'flex-end' }]}>
      {isLeft && <Image source={AV_LEFT} style={[styles.avatar, compact && styles.avatarCompact]} />}
      <View style={[styles.bubble, { maxWidth }, compact && styles.bubbleCompact]}>
        <Text style={[styles.bubbleText, compact && styles.bubbleTextCompact]} numberOfLines={compact ? 2 : 0}>
          {text}
        </Text>
      </View>
      {!isLeft && <Image source={AV_RIGHT} style={[styles.avatar, compact && styles.avatarCompact]} />}
    </View>
  );
}

export default function OnboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<Slide>>(null);

  const isSmallH = height <= 700;
  const isTinyH = height <= 640; 
  const isSmallW = width <= 360;

  const compact = isTinyH;

  const cardW = Math.min(390, width - 26);

  const btnH = compact ? 42 : isSmallH ? 48 : 54;
  const btnRadius = compact ? 15 : 18;
  const btnTextSize = compact ? 15 : isSmallW ? 17 : 18;

  const dotMarginTop = compact ? 5 : 8;

  const cardH = clamp(
    height - (insets.top + insets.bottom) - (compact ? 92 : 120),
    compact ? 500 : isSmallH ? 580 : 640,
    780
  );

  const topImageH = clamp(
    cardH * (compact ? 0.24 : isSmallH ? 0.40 : 0.46),
    compact ? 118 : isSmallH ? 235 : 310,
    compact ? 175 : 420
  );

  const bubbleMaxW = Math.min(cardW - 70, 300);
  const bubbleGap = compact ? 5 : isSmallH ? 7 : 8;

  const bottomPad = (compact ? 10 : 14) + 10; 

  const ctaMarginTop = compact ? 6 : 12;

  const slides: Slide[] = useMemo(
    () => [
      {
        key: 's1',
        image: IMG_1,
        bubbles: [
          { side: 'left', text: 'You have not come to our Empire by chance.' },
          { side: 'right', text: 'Everyone who crosses these gates seeks the strength to control their own destiny.' },
          { side: 'left', text: 'From today on, you are not a subject.' },
        ],
        cta: 'Next',
      },
      {
        key: 's2',
        image: IMG_2,
        bubbles: [
          { side: 'left', text: 'Before acting, a ruler listens to his heart.' },
          { side: 'right', text: 'Choose the path that reflects your mood today.' },
          { side: 'left', text: 'Calm, strength, wisdom, or determination.' },
          { side: 'right', text: 'And we will offer guidance worthy of the throne.' },
        ],
        cta: 'Okay',
      },
      {
        key: 's3',
        image: IMG_3,
        bubbles: [
          { side: 'left', text: 'Every day we issue three imperial orders.' },
          { side: 'right', text: 'Only ten minutes. Discipline is born from small things.' },
          { side: 'left', text: 'Do it — and you will become stronger.' },
          { side: 'right', text: 'If you fail, try again. The Empire teaches.' },
        ],
        cta: 'Continue',
      },
      {
        key: 's4',
        image: IMG_4,
        bubbles: [
          { side: 'left', text: 'Remember… in the shadow of the palace sleeps the Golden Dragon.' },
          { side: 'right', text: 'It guards the Crown. Three tries — and only one correct gate.' },
          { side: 'left', text: 'Find it — and you will receive our gift.' },
        ],
        cta: 'Start',
      },
    ],
    []
  );

  const [index, setIndex] = useState(0);

  const fade = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const moveY = useRef(new Animated.Value(0)).current;

  const playEnter = () => {
    fade.setValue(0);
    scale.setValue(0.988);
    moveY.setValue(10);

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(moveY, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    playEnter();
  }, []);

  const goNext = () => {
    const next = index + 1;
    if (next < slides.length) {
      setIndex(next);
      listRef.current?.scrollToIndex({ index: next, animated: false });
      playEnter();
    } else {
      navigation.replace('Choose');
    }
  };

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView
        style={[
          styles.safe,
          {
            paddingTop: Math.max(10, insets.top),
            paddingBottom: Math.max(10, insets.bottom),
          },
        ]}
      >
        <View style={styles.stage}>
          <FlatList
            ref={listRef}
            data={slides}
            keyExtractor={(s) => s.key}
            horizontal
            pagingEnabled
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={{ width, alignItems: 'center' }}>
                <Animated.View
                  style={[
                    styles.card,
                    {
                      width: cardW,
                      height: cardH,
                      opacity: fade,
                      transform: [{ translateY: moveY }, { scale }],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.topImageBox,
                      {
                        height: topImageH,
                        paddingTop: compact ? 2 : 10,
                        paddingBottom: compact ? 4 : 6,
                      },
                    ]}
                  >
                    <Image source={item.image} style={styles.topImage} resizeMode="contain" />
                  </View>

                  <View
                    style={{
                      flex: 1,
                      paddingHorizontal: compact ? 10 : 12,
                      paddingTop: compact ? 6 : isSmallH ? 8 : 10,
                      paddingBottom: compact ? 8 : 10,
                      gap: bubbleGap,
                    }}
                  >
                    {item.bubbles.map((b, idx) => (
                      <Bubble key={`${item.key}_${idx}`} side={b.side} text={b.text} maxWidth={bubbleMaxW} compact />
                    ))}
                  </View>

                  <View style={[styles.bottomArea, { paddingBottom: bottomPad, paddingTop: compact ? 6 : 8 }]}>
                    <Pressable
                      onPress={goNext}
                      style={({ pressed }) => [
                        styles.ctaBtn,
                        { height: btnH, borderRadius: btnRadius, marginTop: ctaMarginTop },
                        pressed && { transform: [{ scale: 0.985 }] },
                      ]}
                    >
                      <View style={styles.ctaInner}>
                        <Text style={[styles.ctaText, { fontSize: btnTextSize }]}>{item.cta}</Text>
                      </View>
                    </Pressable>

                    <View style={[styles.dotsRow, { marginTop: dotMarginTop }]}>
                      {slides.map((_, i) => (
                        <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
                      ))}
                    </View>
                  </View>
                </Animated.View>
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const R_IMG = 28;

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  stage: { flex: 1, justifyContent: 'center' },

  card: {
    borderRadius: 22,
    backgroundColor: 'rgba(20,0,0,0.55)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    flexDirection: 'column',
  },

  topImageBox: {
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  topImage: {
    width: '100%',
    height: '100%',
    borderRadius: R_IMG,
  },

  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  avatarCompact: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },

  bubble: {
    backgroundColor: '#5b0b0b',
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  bubbleCompact: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  bubbleText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 11.5,
    lineHeight: 15.5,
    fontWeight: '700',
  },
  bubbleTextCompact: {
    fontSize: 11,
    lineHeight: 15,
  },

  bottomArea: {
    paddingHorizontal: 12,
  },

  ctaBtn: {
    overflow: 'hidden',
    backgroundColor: '#f5d37a',
  },

  ctaInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ctaText: {
    fontWeight: '900',
    color: '#2b1200',
    letterSpacing: 0.2,
  },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  dotActive: {
    width: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
});