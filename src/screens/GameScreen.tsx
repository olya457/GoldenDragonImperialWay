import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Pressable,
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

type Props = BottomTabScreenProps<MainTabParamList, 'Game'>;

const BG = require('../assets/bg.png');
const HEADER_IMG = require('../assets/onboard1.png');

const AV_LEFT = require('../assets/avatar_left.png');
const AV_RIGHT = require('../assets/avatar_right.png');

const IC_BACK = require('../assets/ic_back.png');
const IC_SHARE = require('../assets/ic_share.png');

const IMG_DRAGON = require('../assets/game_dragon.png');
const IMG_CROWN_TILE = require('../assets/game_crown_tile.png');
const IMG_CROWN_RESULT = require('../assets/game_crown_result.png');

const REWARD_1 = require('../assets/reward_1.png');
const REWARD_2 = require('../assets/reward_2.png');
const REWARD_3 = require('../assets/reward_3.png');
const REWARD_4 = require('../assets/reward_4.png');
const REWARD_5 = require('../assets/reward_5.png');
const REWARD_6 = require('../assets/reward_6.png');
const REWARD_7 = require('../assets/reward_7.png');

const KEY_CHARACTER = 'selected_character_v1';
const KEY_REWARDS = 'rewards_unlocked_v1';

type Step = 'intro' | 'playing' | 'win' | 'reward' | 'lose';

type GameState = {
  step: Step;
  attemptsLeft: number;
  crownIndex: number;
  opened: number[];
  selectedIndex: number | null;
  rewardIndex: number | null;
};

const ROWS = 3;
const COLS = 5;
const TILES_TOTAL = ROWS * COLS;

const ATTEMPTS_TOTAL = 3;

const GOLD = '#f5d37a';
const BROWN = '#2b1200';

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
function randInt(maxExclusive: number) {
  return Math.floor(Math.random() * maxExclusive);
}

const DEFAULT_STATE: GameState = {
  step: 'intro',
  attemptsLeft: ATTEMPTS_TOTAL,
  crownIndex: 0,
  opened: [],
  selectedIndex: null,
  rewardIndex: null,
};

export default function GameScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const tabBarH = useBottomTabBarHeight();
  const { width, height } = useWindowDimensions();

  const isSmallH = height <= 700;
  const isTinyH = height <= 640;

  const topPad = insets.top;
  const bottomPad = insets.bottom;

  const s = isTinyH ? 0.9 : isSmallH ? 0.95 : 1;
  const overlayH = Math.max(tabBarH, isTinyH ? 78 : isSmallH ? 84 : 92);
  const bottomGuard = bottomPad + overlayH + (isTinyH ? 6 : isSmallH ? 8 : 12);

  const stageOffsetY = isTinyH ? -14 : isSmallH ? -18 : -20;

  const cardW = Math.min(430, width - 26);

  const headerH = isTinyH ? 74 : isSmallH ? 84 : 94;
  const gap = isTinyH ? 8 : isSmallH ? 10 : 14;

  const introDragonH = Math.round((isTinyH ? 132 : isSmallH ? 152 : 185) * s);
  const playDragonH = Math.round((isTinyH ? 142 : isSmallH ? 162 : 195) * s);

  const gridW = Math.min(cardW, width - 34);
  const gridGap = isTinyH ? 7 : isSmallH ? 8 : 10;

  const tileSize = useMemo(() => {
    const raw = Math.floor((gridW - gridGap * (COLS - 1)) / COLS);
    const hard = isTinyH ? 46 : isSmallH ? 50 : 58;
    return Math.min(raw, hard);
  }, [gridW, gridGap, isTinyH, isSmallH]);

  const gridBlockW = tileSize * COLS + gridGap * (COLS - 1);

  const [selectedCharacter, setSelectedCharacter] = useState<'empress' | 'emperor'>('empress');
  const chosenAvatar = selectedCharacter === 'empress' ? AV_LEFT : AV_RIGHT;

  const [state, setState] = useState<GameState>(DEFAULT_STATE);

  const [unlocked, setUnlocked] = useState<boolean[]>(() => new Array(7).fill(false));
  const rewards = useMemo(() => [REWARD_1, REWARD_2, REWARD_3, REWARD_4, REWARD_5, REWARD_6, REWARD_7], []);

  const [dateStr] = useState(() => dateStrNow());

  const anim = useRef(new Animated.Value(0)).current;
  const animateIn = useCallback(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  useEffect(() => {
    animateIn();
  }, [state.step, state.attemptsLeft, state.selectedIndex, state.rewardIndex, animateIn]);

  const fade = anim;
  const y = anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.992, 1] });

  const loadCharacter = useCallback(async () => {
    try {
      const v = await AsyncStorage.getItem(KEY_CHARACTER);
      if (v === 'empress' || v === 'emperor') setSelectedCharacter(v);
    } catch {}
  }, []);

  const loadUnlocked = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY_REWARDS);
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length === 7) setUnlocked(arr.map(Boolean));
    } catch {}
  }, []);

  const persistUnlocked = useCallback(async (arr: boolean[]) => {
    try {
      await AsyncStorage.setItem(KEY_REWARDS, JSON.stringify(arr));
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCharacter();
      loadUnlocked();

      setState({
        ...DEFAULT_STATE,
        step: 'intro',
        attemptsLeft: ATTEMPTS_TOTAL,
        opened: [],
        selectedIndex: null,
        rewardIndex: null,
        crownIndex: 0,
      });

      return undefined;
    }, [loadCharacter, loadUnlocked])
  );

  useEffect(() => {
    loadCharacter();
    loadUnlocked();
  }, [loadCharacter, loadUnlocked]);

  const headerTitle = 'Welcome to Golden\nDragon Imperial Way';

  const startNewGame = useCallback(() => {
    const next: GameState = {
      step: 'playing',
      attemptsLeft: ATTEMPTS_TOTAL,
      crownIndex: randInt(TILES_TOTAL),
      opened: [],
      selectedIndex: null,
      rewardIndex: null,
    };
    setState(next);
  }, []);

  const backToIntro = useCallback(() => {
    setState({
      ...DEFAULT_STATE,
      step: 'intro',
      attemptsLeft: ATTEMPTS_TOTAL,
      opened: [],
      selectedIndex: null,
      rewardIndex: null,
      crownIndex: 0,
    });
  }, []);

  const pickTile = useCallback(
    (idx: number) => {
      if (state.step !== 'playing') return;
      if (state.opened.includes(idx)) return;
      setState((prev) => ({ ...prev, selectedIndex: idx }));
    },
    [state.step, state.opened]
  );

  const openSelected = useCallback(async () => {
    if (state.step !== 'playing') return;
    if (state.selectedIndex === null) return;

    const idx = state.selectedIndex;
    if (state.opened.includes(idx)) return;

    const opened = [idx, ...state.opened];
    const hit = idx === state.crownIndex;

    if (hit) {
      const rewardIndex = randInt(7);
      setState((prev) => ({
        ...prev,
        opened,
        selectedIndex: null,
        step: 'win',
        rewardIndex,
      }));

      const u = [...unlocked];
      u[rewardIndex] = true;
      setUnlocked(u);
      await persistUnlocked(u);
      return;
    }

    const attemptsLeft = clamp(state.attemptsLeft - 1, 0, ATTEMPTS_TOTAL);

    if (attemptsLeft === 0) {
      setState((prev) => ({
        ...prev,
        opened,
        attemptsLeft,
        selectedIndex: null,
        step: 'lose',
        rewardIndex: null,
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      opened,
      attemptsLeft,
      selectedIndex: null,
    }));
  }, [
    state.step,
    state.selectedIndex,
    state.opened,
    state.crownIndex,
    state.attemptsLeft,
    unlocked,
    persistUnlocked,
  ]);

  const goToReward = useCallback(() => {
    if (state.step !== 'win') return;
    setState((prev) => ({ ...prev, step: 'reward' }));
  }, [state.step]);

  const tryAgain = useCallback(() => {
    startNewGame();
  }, [startNewGame]);

  const shareResult = useCallback(async () => {
    try {
      let msg = 'Golden Dragon Imperial Way';
      if (state.step === 'reward' && state.rewardIndex !== null)
        msg = `I unlocked a new reward image (#${state.rewardIndex + 1}).`;
      if (state.step === 'win') msg = 'I found the crown!';
      if (state.step === 'lose') msg = 'Game over. I will try again!';
      await Share.share({ message: msg });
    } catch {}
  }, [state.step, state.rewardIndex]);

  const attemptText = useMemo(() => {
    const used = ATTEMPTS_TOTAL - state.attemptsLeft;
    const current = clamp(used + 1, 1, ATTEMPTS_TOTAL);
    return `Attempt ${current}/${ATTEMPTS_TOTAL}`;
  }, [state.attemptsLeft]);

  const canOpen = state.step === 'playing' && state.selectedIndex !== null;

  const rewardBoxSize = useMemo(() => {
    const base = Math.min(cardW, width - 26);
    const half = Math.floor(base * 0.5);
    const hard = isTinyH ? 160 : isSmallH ? 178 : 200;
    return Math.min(half, hard);
  }, [cardW, width, isTinyH, isSmallH]);

  const btnH = Math.round((isTinyH ? 50 : isSmallH ? 52 : 54) * s);
  const openBtnH = Math.round((isTinyH ? 48 : isSmallH ? 50 : 52) * s);

  const androidDown = Platform.OS === 'android' ? 20 : 0;

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={{ flex: 1, paddingTop: topPad }}>
        <View style={[styles.stage, { marginTop: stageOffsetY + androidDown }]}>
          <View style={[styles.headerCard, { width: cardW, height: headerH, marginBottom: gap }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerThumbWrap, isTinyH && { width: 52, height: 52 }]}>
                <Image source={HEADER_IMG} style={styles.headerThumb} resizeMode="cover" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { fontSize: isTinyH ? 14.5 : 16 }]}>{headerTitle}</Text>
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
                paddingBottom: bottomGuard,
              },
            ]}
          >
            {state.step === 'intro' ? (
              <View style={{ flex: 1 }}>
                <View style={[styles.introCard, { marginBottom: gap, paddingVertical: isTinyH ? 10 : 12 }]}>
                  <View style={styles.introRow}>
                    <View
                      style={[
                        styles.avatarWrap,
                        isTinyH && { width: 48, height: 48, borderRadius: 15, marginRight: 10 },
                      ]}
                    >
                      <Image source={chosenAvatar} style={styles.avatarImg} resizeMode="contain" />
                    </View>

                    <Text
                      style={[
                        styles.introText,
                        isTinyH && { fontSize: 12, lineHeight: 17 },
                        isSmallH && !isTinyH && { fontSize: 12.5, lineHeight: 17.5 },
                      ]}
                      numberOfLines={3}
                    >
                      Find my crown and unlock a reward image. Ready?
                    </Text>
                  </View>
                </View>

                <View style={[styles.dragonCard, { height: introDragonH, marginBottom: gap }]}>
                  <Image source={IMG_DRAGON} style={styles.dragonImg} resizeMode="cover" />
                </View>

                <Pressable
                  onPress={startNewGame}
                  style={({ pressed }) => [
                    styles.bigGoldBtn,
                    { height: btnH },
                    pressed && { transform: [{ scale: 0.99 }] },
                  ]}
                >
                  <Text style={[styles.bigGoldText, isTinyH && { fontSize: 17 }]}>Start</Text>
                </Pressable>

                <View style={{ marginTop: isTinyH ? 8 : 10 }}>
                  <Text style={styles.collectionHint}>Collection: {unlocked.filter(Boolean).length}/7 unlocked</Text>
                </View>
              </View>
            ) : null}

            {state.step === 'playing' ? (
              <View style={{ flex: 1 }}>
                <View style={[styles.dragonCard, { height: playDragonH, marginBottom: gap }]}>
                  <Image source={IMG_DRAGON} style={styles.dragonImg} resizeMode="cover" />
                </View>

                <View style={[styles.attemptPill, { alignSelf: 'center', marginBottom: Math.max(6, gap - 4) }]}>
                  <Text style={[styles.attemptText, isTinyH && { fontSize: 11 }]}>{attemptText}</Text>
                </View>

                <View style={{ width: gridBlockW, alignSelf: 'center' }}>
                  {Array.from({ length: ROWS }).map((_, r) => (
                    <View key={`r_${r}`} style={[styles.gridRow, { marginBottom: r === ROWS - 1 ? 0 : gridGap }]}>
                      {Array.from({ length: COLS }).map((__, c) => {
                        const idx = r * COLS + c;
                        const isOpened = state.opened.includes(idx);
                        const isSelected = state.selectedIndex === idx;

                        return (
                          <Pressable
                            key={`t_${idx}`}
                            onPress={() => pickTile(idx)}
                            style={({ pressed }) => [
                              styles.tile,
                              {
                                width: tileSize,
                                height: tileSize,
                                marginRight: c === COLS - 1 ? 0 : gridGap,
                                borderRadius: isTinyH ? 11 : 12,
                              },
                              isSelected && styles.tileSelected,
                              pressed && !isOpened && { transform: [{ scale: 0.99 }] },
                            ]}
                          >
                            <View style={[styles.tileInner, { padding: isTinyH ? 5 : 6 }]}>
                              {!isOpened ? (
                                <Image
                                  source={IMG_CROWN_TILE}
                                  style={[styles.tileCrownImg, isTinyH && { width: 18, height: 18 }]}
                                  resizeMode="contain"
                                />
                              ) : idx === state.crownIndex ? (
                                <Image
                                  source={IMG_CROWN_TILE}
                                  style={[styles.tileCrownImgBig, isTinyH && { width: 24, height: 24 }]}
                                  resizeMode="contain"
                                />
                              ) : (
                                <Text style={[styles.emptyText, isTinyH && { fontSize: 9, lineHeight: 13 }]}>
                                  It&apos;s empty{'\n'}here.
                                </Text>
                              )}
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                </View>

                <View style={[styles.bottomBar, { width: cardW, marginTop: gap, marginBottom: isTinyH ? 6 : 8 }]}>
                  <Pressable
                    onPress={backToIntro}
                    style={({ pressed }) => [styles.backRound, pressed && { transform: [{ scale: 0.98 }] }]}
                  >
                    <Image source={IC_BACK} style={styles.backIcon} resizeMode="contain" />
                  </Pressable>

                  <Pressable
                    disabled={!canOpen}
                    onPress={openSelected}
                    style={({ pressed }) => [
                      styles.openBtn,
                      { height: openBtnH },
                      !canOpen && { opacity: 0.55 },
                      pressed && canOpen && { transform: [{ scale: 0.99 }] },
                    ]}
                  >
                    <Text style={[styles.openBtnText, isTinyH && { fontSize: 17 }]}>Open</Text>
                  </Pressable>
                </View>

                <View style={{ marginTop: isTinyH ? 8 : 10 }}>
                  <Text style={styles.collectionHint}>Collection: {unlocked.filter(Boolean).length}/7 unlocked</Text>
                </View>
              </View>
            ) : null}

            {state.step === 'win' ? (
              <View style={{ flex: 1 }}>
                <View
                  style={[
                    styles.resultCard,
                    { height: Math.round((isTinyH ? 235 : isSmallH ? 270 : 310) * s), marginBottom: gap },
                  ]}
                >
                  <Image source={IMG_CROWN_RESULT} style={styles.resultImg} resizeMode="contain" />
                </View>

                <View style={[styles.dialogCard, { marginBottom: gap, paddingVertical: isTinyH ? 10 : 12 }]}>
                  <View style={styles.dialogRow}>
                    <View
                      style={[
                        styles.dialogAvatarWrap,
                        isTinyH && { width: 48, height: 48, borderRadius: 15, marginRight: 10 },
                      ]}
                    >
                      <Image source={chosenAvatar} style={styles.dialogAvatarImg} resizeMode="contain" />
                    </View>

                    <Text style={[styles.dialogText, isTinyH && { fontSize: 12, lineHeight: 17 }]} numberOfLines={3}>
                      You found my crown! Here is your reward.
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={goToReward}
                  style={({ pressed }) => [
                    styles.bigGoldBtn,
                    { height: btnH },
                    pressed && { transform: [{ scale: 0.99 }] },
                  ]}
                >
                  <Text style={[styles.bigGoldText, isTinyH && { fontSize: 17 }]}>Next</Text>
                </Pressable>
              </View>
            ) : null}

            {state.step === 'reward' ? (
              <View style={{ flex: 1 }}>
                <View style={[styles.rewardWrap, { marginBottom: gap }]}>
                  <View style={[styles.rewardBox, { width: rewardBoxSize, height: rewardBoxSize }]}>
                    <Image
                      source={state.rewardIndex !== null ? rewards[state.rewardIndex] : rewards[0]}
                      style={styles.rewardImg}
                      resizeMode="cover"
                    />
                  </View>
                </View>

                <View style={[styles.dialogCard, { marginBottom: gap, paddingVertical: isTinyH ? 10 : 12 }]}>
                  <View style={styles.dialogRow}>
                    <View
                      style={[
                        styles.dialogAvatarWrap,
                        isTinyH && { width: 48, height: 48, borderRadius: 15, marginRight: 10 },
                      ]}
                    >
                      <Image source={chosenAvatar} style={styles.dialogAvatarImg} resizeMode="contain" />
                    </View>

                    <Text style={[styles.dialogText, isTinyH && { fontSize: 12, lineHeight: 17 }]} numberOfLines={2}>
                      This reward image is now in your collection.
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Pressable
                    onPress={backToIntro}
                    style={({ pressed }) => [styles.backRound, pressed && { transform: [{ scale: 0.98 }] }]}
                  >
                    <Image source={IC_BACK} style={styles.backIcon} resizeMode="contain" />
                  </Pressable>

                  <Pressable
                    onPress={shareResult}
                    style={({ pressed }) => [
                      styles.bigGoldBtn,
                      { flex: 1, height: btnH },
                      pressed && { transform: [{ scale: 0.99 }] },
                    ]}
                  >
                    <Image source={IC_SHARE} style={styles.shareIcon} resizeMode="contain" />
                    <Text style={[styles.bigGoldText, isTinyH && { fontSize: 17 }]}>Share</Text>
                  </Pressable>
                </View>

                <View style={{ height: isTinyH ? 10 : 12 }} />

                <Pressable
                  onPress={tryAgain}
                  style={({ pressed }) => [
                    styles.tryAgainBtn,
                    { height: openBtnH },
                    pressed && { transform: [{ scale: 0.99 }] },
                  ]}
                >
                  <Text style={[styles.tryAgainText, isTinyH && { fontSize: 17 }]}>Try again</Text>
                </Pressable>
              </View>
            ) : null}

            {state.step === 'lose' ? (
              <View style={{ flex: 1 }}>
                <View style={[styles.dragonCard, { height: playDragonH, marginBottom: gap }]}>
                  <Image source={IMG_DRAGON} style={styles.dragonImg} resizeMode="cover" />
                  <View style={styles.gameOverBadge}>
                    <Text style={styles.gameOverText}>Game over</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Pressable
                    onPress={backToIntro}
                    style={({ pressed }) => [styles.backRound, pressed && { transform: [{ scale: 0.98 }] }]}
                  >
                    <Image source={IC_BACK} style={styles.backIcon} resizeMode="contain" />
                  </Pressable>

                  <Pressable
                    onPress={shareResult}
                    style={({ pressed }) => [
                      styles.bigGoldBtn,
                      { flex: 1, height: btnH },
                      pressed && { transform: [{ scale: 0.99 }] },
                    ]}
                  >
                    <Image source={IC_SHARE} style={styles.shareIcon} resizeMode="contain" />
                    <Text style={[styles.bigGoldText, isTinyH && { fontSize: 17 }]}>Share</Text>
                  </Pressable>
                </View>

                <View style={{ height: isTinyH ? 10 : 12 }} />

                <Pressable
                  onPress={tryAgain}
                  style={({ pressed }) => [
                    styles.tryAgainBtn,
                    { height: openBtnH },
                    pressed && { transform: [{ scale: 0.99 }] },
                  ]}
                >
                  <Text style={[styles.tryAgainText, isTinyH && { fontSize: 17 }]}>Try again</Text>
                </Pressable>
              </View>
            ) : null}
          </Animated.View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },

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

  introCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(40,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  introRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(120,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    overflow: 'hidden',
    marginRight: 12,
  },
  avatarImg: { width: '100%', height: '100%' },
  introText: { flex: 1, color: 'rgba(255,255,255,0.90)', fontWeight: '800', fontSize: 13, lineHeight: 18 },

  dragonCard: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.40)',
  },
  dragonImg: { width: '100%', height: '100%' },

  attemptPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(120,0,0,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
  },
  attemptText: { color: 'rgba(255,255,255,0.92)', fontWeight: '900', fontSize: 12 },

  gridRow: { flexDirection: 'row', alignItems: 'center' },

  tile: {
    borderRadius: 12,
    backgroundColor: 'rgba(120,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.45)',
    overflow: 'hidden',
  },
  tileSelected: { borderColor: 'rgba(245,211,122,0.95)', backgroundColor: 'rgba(160,0,0,0.62)' },
  tileInner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 6 },

  tileCrownImg: { width: 20, height: 20, opacity: 0.92 },
  tileCrownImgBig: { width: 26, height: 26 },

  emptyText: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '900',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },

  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  backRound: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { width: 22, height: 22 },

  openBtn: {
    flex: 1,
    marginLeft: 12,
    height: 52,
    borderRadius: 999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openBtnText: { color: BROWN, fontWeight: '900', fontSize: 18 },

  bigGoldBtn: {
    height: 54,
    borderRadius: 999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  bigGoldText: { color: BROWN, fontWeight: '900', fontSize: 18 },
  shareIcon: { width: 18, height: 18 },

  resultCard: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.40)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultImg: { width: '100%', height: '100%' },

  rewardWrap: { alignItems: 'center', justifyContent: 'center' },
  rewardBox: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.40)',
  },
  rewardImg: { width: '100%', height: '100%' },

  dialogCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(40,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dialogRow: { flexDirection: 'row', alignItems: 'center' },
  dialogAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(120,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    overflow: 'hidden',
    marginRight: 12,
  },
  dialogAvatarImg: { width: '100%', height: '100%' },
  dialogText: { flex: 1, color: 'rgba(255,255,255,0.90)', fontWeight: '800', fontSize: 13, lineHeight: 18 },

  tryAgainBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: 'rgba(120,0,0,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryAgainText: { color: GOLD, fontWeight: '900', fontSize: 18 },

  gameOverBadge: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(120,0,0,0.70)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
  },
  gameOverText: { color: 'rgba(255,255,255,0.92)', fontWeight: '900', fontSize: 12 },

  collectionHint: { textAlign: 'center', color: 'rgba(255,255,255,0.70)', fontWeight: '800', fontSize: 12 },
});