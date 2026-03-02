import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../navigation/types';

const BG = require('../assets/bg.png');
const HEADER_IMG = require('../assets/onboard1.png');

const AV_LEFT = require('../assets/avatar_left.png');
const AV_RIGHT = require('../assets/avatar_right.png');

const KEY_CHARACTER = 'selected_character_v1';

type Props = BottomTabScreenProps<MainTabParamList, 'ChangeCharacter'>;

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function dateStrNow() {
  const d = new Date();
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

const GOLD = '#f5d37a';
const BROWN = '#2b1200';

export default function ChangeCharacterScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [selectedCharacter, setSelectedCharacter] = useState<'empress' | 'emperor'>('empress');
  const [dateStr] = useState(() => dateStrNow());

  const isSmallH = height <= 700;
  const isTinyH = height <= 640;
  const isSmallW = width <= 360;

  const cardW = Math.min(430, width - 26);
  const headerH = isTinyH ? 74 : isSmallH ? 84 : 94;

  const topPad = Math.max(10, insets.top);
  const bottomPad = Math.max(10, insets.bottom);

  const gap = isTinyH ? 12 : isSmallH ? 16 : 18;

  const thumbSize = isTinyH ? 50 : isSmallH ? 54 : 58;
  const thumbRadius = isTinyH ? 12 : 14;

  const titleSize = isTinyH ? 14 : 16;
  const titleLine = isTinyH ? 16 : 18;
  const dateSize = isTinyH ? 11 : 12;

  const questionPadH = isTinyH ? 12 : 16;
  const questionPadV = isTinyH ? 12 : 16;

  const avatarSize = isTinyH ? 52 : isSmallH ? 56 : 60;
  const avatarRadius = isTinyH ? 14 : 16;

  const questionFont = isTinyH ? 13 : isSmallW ? 14 : 15;
  const questionLine = isTinyH ? 18 : 20;

  const btnH = isTinyH ? 48 : isSmallH ? 52 : 54;
  const btnFont = isTinyH ? 16 : 18;

  const stageTop = isTinyH ? 8 : 12;

  const chosenAvatar = useMemo(
    () => (selectedCharacter === 'empress' ? AV_LEFT : AV_RIGHT),
    [selectedCharacter]
  );

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(KEY_CHARACTER);
        if (v === 'empress' || v === 'emperor') setSelectedCharacter(v);
      } catch {}
    })();
  }, []);

  const onYes = useCallback(() => {
    navigation.getParent()?.navigate('Choose' as never);
  }, [navigation]);

  const onNo = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const headerTitle = 'Welcome to Golden\nDragon Imperial Way';

  const maxStageW = cardW;
  const stageMinH = clamp(height - topPad - bottomPad, 0, 10000);

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={[styles.safe, { paddingTop: topPad, paddingBottom: bottomPad }]}>
        <View style={[styles.stage, { minHeight: stageMinH, paddingTop: stageTop }]}>
          <View style={[styles.headerCard, { width: maxStageW, height: headerH, marginBottom: gap }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerThumbWrap, { width: thumbSize, height: thumbSize, borderRadius: thumbRadius }]}>
                <Image source={HEADER_IMG} style={styles.headerThumb} resizeMode="cover" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { fontSize: titleSize, lineHeight: titleLine }]}>{headerTitle}</Text>
                <Text style={[styles.headerDate, { fontSize: dateSize }]}>{dateStr}</Text>
              </View>
            </View>

            <View style={styles.headerDot} />
          </View>

          <View style={[styles.questionCard, { width: maxStageW, paddingHorizontal: questionPadH, paddingVertical: questionPadV, marginBottom: gap }]}>
            <View style={styles.questionRow}>
              <View style={[styles.avatarWrap, { width: avatarSize, height: avatarSize, borderRadius: avatarRadius }]}>
                <Image source={chosenAvatar} style={styles.avatarImg} resizeMode="contain" />
              </View>

              <Text style={[styles.questionText, { fontSize: questionFont, lineHeight: questionLine }]} numberOfLines={3}>
                Do you want to change your character?
              </Text>
            </View>
          </View>

          <Pressable
            onPress={onYes}
            style={({ pressed }) => [
              styles.goldBtn,
              { width: maxStageW, height: btnH, marginBottom: isTinyH ? 10 : 14 },
              pressed && { transform: [{ scale: 0.99 }] },
            ]}
          >
            <Text style={[styles.goldBtnText, { fontSize: btnFont }]}>Yes</Text>
          </Pressable>

          <Pressable
            onPress={onNo}
            style={({ pressed }) => [
              styles.goldBtn,
              { width: maxStageW, height: btnH },
              pressed && { transform: [{ scale: 0.99 }] },
            ]}
          >
            <Text style={[styles.goldBtnText, { fontSize: btnFont }]}>No</Text>
          </Pressable>

          <View style={{ height: isTinyH ? 6 : 10 }} />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },

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
    overflow: 'hidden',
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  headerThumb: { width: '100%', height: '100%' },

  headerTitle: { color: '#fff', fontWeight: '900' },

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

  questionCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(40,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.35)',
  },

  questionRow: { flexDirection: 'row', alignItems: 'center' },

  avatarWrap: {
    backgroundColor: 'rgba(120,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  avatarImg: { width: '100%', height: '100%' },

  questionText: { flex: 1, color: 'rgba(255,255,255,0.92)', fontWeight: '800' },

  goldBtn: {
    borderRadius: 999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },

  goldBtnText: {
    color: BROWN,
    fontWeight: '900',
  },
});