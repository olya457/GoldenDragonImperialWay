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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';

import type { MainTabParamList } from '../navigation/types';
import { TIP_CATEGORIES, DAILY_TASKS, TipCategoryId } from '../data/dailyTipsData';

type Props = BottomTabScreenProps<MainTabParamList, 'HomeDailyTips'>;

const BG = require('../assets/bg.png');
const HEADER_IMG = require('../assets/onboard1.png');

const AV_LEFT = require('../assets/avatar_left.png');
const AV_RIGHT = require('../assets/avatar_right.png');

const IC_BACK = require('../assets/ic_back.png');
const IC_SHARE = require('../assets/ic_share.png');
const IC_SAVE = require('../assets/ic_save.png');
const IC_SAVE_FILLED = require('../assets/ic_save_filled.png');
const IC_REFRESH = require('../assets/ic_refresh.png');
const IC_PLAY = require('../assets/ic_play.png');
const IC_PAUSE = require('../assets/ic_pause.png');
const IC_CHECK = require('../assets/ic_check.png');
const IC_X = require('../assets/ic_x.png');

type Tab = 'tips' | 'task';

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${pad2(m)}:${pad2(s)}`;
}
function pickRandomIndex(len: number) {
  if (len <= 1) return 0;
  return Math.floor(Math.random() * len);
}

type SavedTipItem = {
  id: string;
  categoryId: TipCategoryId;
  categoryTitle: string;
  text: string;
  createdAt: number;
};

const KEY_SAVED_TIPS = 'saved_tips_v1';
const KEY_CHARACTER = 'selected_character_v1';

const GOLD = '#f5d37a';

export default function HomeDailyTipsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmallH = height <= 700;
  const isTinyH = height <= 640;

  const cardW = Math.min(430, width - 26);

  const topPad = insets.top;
  const bottomPad = insets.bottom;

  const gap = isTinyH ? 10 : isSmallH ? 12 : 14;

  const headerH = isTinyH ? 78 : isSmallH ? 88 : 94;
  const guideH = isTinyH ? 78 : isSmallH ? 86 : 92;
  const tabsH = isTinyH ? 40 : 42;

  const stageH = height - topPad - bottomPad;

  const availableForMain = stageH - headerH - guideH - tabsH - gap * 5;
  const baseMainBoxH = Math.max(
    isTinyH ? 320 : 350,
    Math.min(availableForMain, isTinyH ? 380 : isSmallH ? 410 : 430)
  );

  const mainBoxH = Math.max(isTinyH ? 300 : 330, baseMainBoxH - 20);

  const mainPad = isTinyH ? 12 : 14;
  const gridGap = isTinyH ? 10 : 12;

  const tileW = (cardW - mainPad * 2 - gridGap) / 2;
  const tileH = (mainBoxH - mainPad * 2 - gridGap) / 2;

  const [tab, setTab] = useState<Tab>('tips');

  const [selectedCharacter, setSelectedCharacter] = useState<'empress' | 'emperor'>('empress');
  const chosenAvatar = selectedCharacter === 'empress' ? AV_LEFT : AV_RIGHT;

  const loadCharacter = useCallback(async () => {
    try {
      const v = await AsyncStorage.getItem(KEY_CHARACTER);
      if (v === 'empress' || v === 'emperor') setSelectedCharacter(v);
      else setSelectedCharacter('empress');
    } catch {
      setSelectedCharacter('empress');
    }
  }, []);

  useEffect(() => {
    loadCharacter();
  }, [loadCharacter]);

  useFocusEffect(
    useCallback(() => {
      loadCharacter();
    }, [loadCharacter])
  );

  const dateStr = useMemo(() => {
    const d = new Date();
    return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
  }, []);

  const [tipCat, setTipCat] = useState<TipCategoryId | null>(null);
  const [tipIndex, setTipIndex] = useState(0);

  const activeCategory = useMemo(() => {
    if (!tipCat) return null;
    return TIP_CATEGORIES.find((c) => c.id === tipCat) ?? null;
  }, [tipCat]);

  const tipText = activeCategory ? activeCategory.tips[tipIndex] : '';

  const [savedIDs, setSavedIDs] = useState<Set<string>>(new Set());

  const loadSaved = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY_SAVED_TIPS);
      const arr: SavedTipItem[] = raw ? JSON.parse(raw) : [];
      setSavedIDs(new Set((Array.isArray(arr) ? arr : []).map((x) => x.id)));
    } catch {
      setSavedIDs(new Set());
    }
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  useFocusEffect(
    useCallback(() => {
      loadSaved();
    }, [loadSaved])
  );

  const currentTipId = useMemo(() => {
    if (!activeCategory) return '';
    return `${activeCategory.id}_${tipIndex}`;
  }, [activeCategory, tipIndex]);

  const isSaved = currentTipId ? savedIDs.has(currentTipId) : false;

  const animateA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animateA.setValue(0);
    Animated.timing(animateA, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [tab, tipCat, tipIndex, animateA]);

  const onShareTip = async () => {
    if (!activeCategory) return;
    try {
      await Share.share({ message: `${activeCategory.title}: ${tipText}` });
    } catch {}
  };

  const saveOrUnsaveTip = async () => {
    if (!activeCategory) return;
    try {
      const raw = await AsyncStorage.getItem(KEY_SAVED_TIPS);
      const arr: SavedTipItem[] = raw ? JSON.parse(raw) : [];
      const safeArr = Array.isArray(arr) ? arr : [];

      const id = currentTipId;
      const exists = safeArr.find((x) => x.id === id);

      let next: SavedTipItem[];
      if (exists) {
        next = safeArr.filter((x) => x.id !== id);
      } else {
        const item: SavedTipItem = {
          id,
          categoryId: activeCategory.id,
          categoryTitle: activeCategory.title,
          text: tipText,
          createdAt: Date.now(),
        };
        next = [item, ...safeArr];
      }

      await AsyncStorage.setItem(KEY_SAVED_TIPS, JSON.stringify(next));
      setSavedIDs(new Set(next.map((x) => x.id)));
    } catch {}
  };

  const randomizeTip = () => {
    if (!activeCategory) return;
    setTipIndex(pickRandomIndex(activeCategory.tips.length));
  };

  const prevTip = () => {
    if (!activeCategory) return;
    const len = activeCategory.tips.length;
    setTipIndex((p) => (p - 1 + len) % len);
  };

  const nextTip = () => {
    if (!activeCategory) return;
    const len = activeCategory.tips.length;
    setTipIndex((p) => (p + 1) % len);
  };

  const [taskId, setTaskId] = useState(0);
  const [taskPhase, setTaskPhase] = useState<'pick' | 'running' | 'finished'>('pick');
  const [secondsLeft, setSecondsLeft] = useState(10 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (taskPhase !== 'running' || !running) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [taskPhase, running]);

  useEffect(() => {
    if (taskPhase === 'running' && secondsLeft === 0) {
      setRunning(false);
      setTaskPhase('finished');
    }
  }, [secondsLeft, taskPhase]);

  const startTask = () => {
    setSecondsLeft(10 * 60);
    setTaskPhase('running');
    setRunning(true);
  };

  const toggleRun = () => setRunning((p) => !p);

  const backToPick = () => {
    setRunning(false);
    setTaskPhase('pick');
    setSecondsLeft(10 * 60);
  };

  const refreshTask = () => {
    setTaskId((p) => (p + 1) % DAILY_TASKS.length);
  };

  const guideText =
    tab === 'tips'
      ? tipCat === null
        ? 'Choose who you are today to get tips.'
        : 'Here is your daily tip.'
      : taskPhase === 'pick'
      ? 'Choose the task that interests you the most.'
      : taskPhase === 'running'
      ? 'Complete the task to improve your routine.'
      : 'Did you complete the task? Be honest.';

  const contentOpacity = animateA;
  const contentScale = animateA.interpolate({ inputRange: [0, 1], outputRange: [0.992, 1] });
  const contentY = animateA.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  const tiles4 = useMemo(() => {
    const arr = TIP_CATEGORIES.slice(0, 4);
    while (arr.length < 4) {
      arr.push({
        id: (`__empty_${arr.length}` as unknown) as TipCategoryId,
        title: '',
        tips: [],
        glyphImage: undefined as any,
      });
    }
    return arr;
  }, []);

  const row1 = tiles4.slice(0, 2);
  const row2 = tiles4.slice(2, 4);

  const renderTile = (c: any, idx: number) => {
    const isEmpty = String(c.id).startsWith('__empty_');
    if (isEmpty) {
      return <View key={`empty_${idx}`} style={[styles.tipTile, { width: tileW, height: tileH, opacity: 0 }]} />;
    }

    return (
      <Pressable
        key={c.id}
        onPress={() => {
          setTipCat(c.id);
          setTipIndex(0);
        }}
        style={({ pressed }) => [
          styles.tipTile,
          { width: tileW, height: tileH },
          pressed && { transform: [{ scale: 0.99 }] },
        ]}
      >
        <View style={styles.tipTileInner}>
          <View style={styles.glyphBox}>
            <Image source={c.glyphImage} style={styles.glyphImg} resizeMode="contain" />
          </View>

          <View style={styles.tipTileFooter}>
            <Text style={[styles.tipTileLabel, isTinyH && { fontSize: 12 }]} numberOfLines={1}>
              {c.title}
            </Text>
            <View style={styles.smallRing} />
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={{ flex: 1, paddingTop: topPad, paddingBottom: bottomPad }}>
        <View style={[styles.stage, { marginTop: -20 }]}>
          <View style={[styles.headerCard, { width: cardW, height: headerH, marginBottom: gap }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerThumbWrap, isTinyH && { width: 52, height: 52 }]}>
                <Image source={HEADER_IMG} style={styles.headerThumb} resizeMode="cover" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { fontSize: isTinyH ? 15 : 16 }]}>
                  Welcome to Golden{'\n'}Dragon Imperial Way
                </Text>
                <Text style={[styles.headerDate, { fontSize: isTinyH ? 11 : 12 }]}>{dateStr}</Text>
              </View>
            </View>

            <View style={styles.headerDot} />
          </View>

          <View style={[styles.guideCard, { width: cardW, height: guideH, marginBottom: gap }]}>
            <View style={styles.guideRow}>
              <View
                style={[
                  styles.guideAvatarWrap,
                  isTinyH && { width: 48, height: 48 },
                  isSmallH && !isTinyH && { width: 52, height: 52 },
                ]}
              >
                <Image source={chosenAvatar} style={styles.guideAvatar} resizeMode="contain" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.guideTitle, isTinyH && { fontSize: 12 }]}>Your Guide</Text>
                <Text style={[styles.guideText, isTinyH && { fontSize: 12 }]} numberOfLines={2}>
                  {guideText}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.tabsRow, { width: cardW, height: tabsH, marginBottom: gap }]}>
            <Pressable
              onPress={() => {
                setTab('tips');
                setTipCat(null);
                setTipIndex(0);
              }}
              style={({ pressed }) => [
                styles.tabBtn,
                tab === 'tips' && styles.tabBtnActive,
                pressed && { transform: [{ scale: 0.99 }] },
              ]}
            >
              <Text style={[styles.tabText, tab === 'tips' && styles.tabTextActive]}>Daily tips</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setTab('task');
                setTipCat(null);
                setTipIndex(0);
              }}
              style={({ pressed }) => [
                styles.tabBtn,
                tab === 'task' && styles.tabBtnActive,
                pressed && { transform: [{ scale: 0.99 }] },
              ]}
            >
              <Text style={[styles.tabText, tab === 'task' && styles.tabTextActive]}>Daily task</Text>
            </Pressable>
          </View>

          <Animated.View
            style={[
              styles.mainBox,
              {
                width: cardW,
                height: mainBoxH,
                padding: mainPad,
                opacity: contentOpacity,
                transform: [{ translateY: contentY }, { scale: contentScale }],
              },
            ]}
          >
            {tab === 'tips' ? (
              tipCat === null ? (
                <View style={{ flex: 1 }}>
                  <View style={[styles.gridRow, { marginBottom: gridGap }]}>
                    {renderTile(row1[0], 0)}
                    <View style={{ width: gridGap }} />
                    {renderTile(row1[1], 1)}
                  </View>

                  <View style={styles.gridRow}>
                    {renderTile(row2[0], 2)}
                    <View style={{ width: gridGap }} />
                    {renderTile(row2[1], 3)}
                  </View>
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <View style={styles.tipResultRow}>
                    <View style={styles.tipMiniLeft}>
                      <View style={styles.tipMiniGlyph}>
                        <Image source={activeCategory!.glyphImage} style={styles.glyphMiniImg} resizeMode="contain" />
                      </View>
                      <Text style={styles.tipMiniTag} numberOfLines={1}>
                        {activeCategory!.title}
                      </Text>
                    </View>

                    <View style={styles.tipTextCard}>
                      <Text style={styles.tipTextTitle}>Daily tip</Text>
                      <Text style={[styles.tipTextBody, isTinyH && { fontSize: 13 }]} numberOfLines={6}>
                        {tipText}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tipBottomRow}>
                    <Pressable
                      onPress={prevTip}
                      style={({ pressed }) => [styles.roundBtn, pressed && { transform: [{ scale: 0.98 }] }]}
                    >
                      <Image source={IC_BACK} style={styles.icon} resizeMode="contain" />
                    </Pressable>

                    <Pressable
                      onPress={onShareTip}
                      style={({ pressed }) => [styles.sharePill, pressed && { transform: [{ scale: 0.99 }] }]}
                    >
                      <Image source={IC_SHARE} style={styles.iconSmall} resizeMode="contain" />
                      <Text style={styles.shareText}>Share</Text>
                    </Pressable>

                    <Pressable
                      onPress={saveOrUnsaveTip}
                      style={({ pressed }) => [styles.roundBtn, pressed && { transform: [{ scale: 0.98 }] }]}
                    >
                      <Image source={isSaved ? IC_SAVE_FILLED : IC_SAVE} style={styles.icon} resizeMode="contain" />
                    </Pressable>

                    <Pressable
                      onPress={randomizeTip}
                      style={({ pressed }) => [styles.roundBtn, pressed && { transform: [{ scale: 0.98 }] }]}
                    >
                      <Image source={IC_REFRESH} style={styles.icon} resizeMode="contain" />
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={() => navigation.navigate('SavedNoData')}
                    style={({ pressed }) => [styles.savedHint, pressed && { opacity: 0.9 }]}
                  >
                    <Text style={styles.savedHintText}>Open saved</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setTipCat(null);
                      setTipIndex(0);
                    }}
                    style={({ pressed }) => [styles.backToGrid, pressed && { opacity: 0.9 }]}
                  >
                    <Text style={styles.backToGridText}>Back</Text>
                  </Pressable>
                </View>
              )
            ) : taskPhase === 'pick' ? (
              <View style={{ flex: 1 }}>
                <View style={{ gap: isTinyH ? 10 : 12 }}>
                  {DAILY_TASKS.map((t, i) => {
                    const active = i === taskId;
                    return (
                      <Pressable
                        key={i}
                        onPress={() => setTaskId(i)}
                        style={({ pressed }) => [
                          styles.taskPill,
                          active && styles.taskPillActive,
                          pressed && { transform: [{ scale: 0.99 }] },
                        ]}
                      >
                        <Text style={[styles.taskPillText, active && styles.taskPillTextActive]} numberOfLines={2}>
                          {t}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.taskBottomRow}>
                  <Pressable
                    onPress={startTask}
                    style={({ pressed }) => [styles.chooseBtn, pressed && { transform: [{ scale: 0.99 }] }]}
                  >
                    <Text style={styles.chooseText}>Choose</Text>
                  </Pressable>

                  <Pressable
                    onPress={refreshTask}
                    style={({ pressed }) => [styles.roundBtnBig, pressed && { transform: [{ scale: 0.98 }] }]}
                  >
                    <Image source={IC_REFRESH} style={styles.icon} resizeMode="contain" />
                  </Pressable>
                </View>
              </View>
            ) : taskPhase === 'running' ? (
              <View style={{ flex: 1, justifyContent: 'space-between' }}>
                <View style={styles.taskSelectedPill}>
                  <Text style={styles.taskSelectedText} numberOfLines={2}>
                    {DAILY_TASKS[taskId]}
                  </Text>
                </View>

                <View style={styles.timerRow}>
                  <View style={styles.timerCircle}>
                    <Text style={styles.timerGlyph}>⏱</Text>
                  </View>
                  <View style={styles.timerBox}>
                    <Text style={[styles.timerText, isTinyH && { fontSize: 26 }]}>{formatMMSS(secondsLeft)}</Text>
                  </View>
                </View>

                <View style={styles.taskControls}>
                  <Pressable
                    onPress={backToPick}
                    style={({ pressed }) => [styles.roundBtnBig, pressed && { transform: [{ scale: 0.98 }] }]}
                  >
                    <Image source={IC_BACK} style={styles.icon} resizeMode="contain" />
                  </Pressable>

                  <Pressable
                    onPress={toggleRun}
                    style={({ pressed }) => [styles.roundBtnBig, pressed && { transform: [{ scale: 0.98 }] }]}
                  >
                    <Image source={running ? IC_PAUSE : IC_PLAY} style={styles.icon} resizeMode="contain" />
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={{ flex: 1, justifyContent: 'space-between' }}>
                <View style={styles.taskSelectedPill}>
                  <Text style={styles.taskSelectedText} numberOfLines={2}>
                    {DAILY_TASKS[taskId]}
                  </Text>
                </View>

                <View style={styles.timerRow}>
                  <View style={styles.timerCircle}>
                    <Text style={styles.timerGlyph}>⏱</Text>
                  </View>
                  <View style={styles.timerBox}>
                    <Text style={[styles.timerText, isTinyH && { fontSize: 22 }]}>Time is up.</Text>
                  </View>
                </View>

                <View style={styles.finishRow}>
                  <Pressable
                    onPress={backToPick}
                    style={({ pressed }) => [styles.roundBtnBig, pressed && { transform: [{ scale: 0.98 }] }]}
                  >
                    <Image source={IC_BACK} style={styles.icon} resizeMode="contain" />
                  </Pressable>

                  <Pressable
                    onPress={backToPick}
                    style={({ pressed }) => [styles.roundBtnBig, pressed && { transform: [{ scale: 0.98 }] }]}
                  >
                    <Image source={IC_CHECK} style={styles.icon} resizeMode="contain" />
                  </Pressable>

                  <Pressable
                    onPress={backToPick}
                    style={({ pressed }) => [styles.roundBtnBig, pressed && { transform: [{ scale: 0.98 }] }]}
                  >
                    <Image source={IC_X} style={styles.icon} resizeMode="contain" />
                  </Pressable>
                </View>
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
    paddingTop: 0,
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

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerThumbWrap: {
    width: 58,
    height: 58,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 10,
  },

  headerThumb: { width: '100%', height: '100%' },

  headerTitle: {
    color: '#fff',
    fontWeight: '900',
    lineHeight: 18,
  },

  headerDate: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '700',
  },

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
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },

  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  guideAvatarWrap: {
    width: 56,
    height: 56,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  guideAvatar: {
    width: '100%',
    height: '100%',
  },

  guideTitle: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 14,
    marginBottom: 4,
  },

  guideText: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 16,
  },

  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabBtn: {
    flex: 1,
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(70,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabBtnActive: {
    backgroundColor: 'rgba(120,0,0,0.68)',
    borderColor: 'rgba(245,211,122,0.65)',
  },

  tabText: {
    color: 'rgba(255,255,255,0.70)',
    fontWeight: '900',
    fontSize: 13,
  },

  tabTextActive: { color: GOLD },

  mainBox: {
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.40)',
  },

  gridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    flex: 1,
  },

  tipTile: {
    borderRadius: 18,
    backgroundColor: 'rgba(60,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
    overflow: 'hidden',
  },

  tipTileInner: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },

  glyphBox: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 8,
    justifyContent: 'center',
  },

  glyphImg: {
    width: '100%',
    height: '100%',
  },

  tipTileFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  tipTileLabel: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '900',
    fontSize: 13,
    maxWidth: '80%',
  },

  smallRing: {
    width: 18,
    height: 18,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
    backgroundColor: 'rgba(245,211,122,0.12)',
  },

  tipResultRow: { flexDirection: 'row', marginBottom: 10 },

  tipMiniLeft: {
    width: 96,
    borderRadius: 16,
    backgroundColor: 'rgba(60,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  tipMiniGlyph: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.12)',
    padding: 8,
  },

  glyphMiniImg: { width: '100%', height: '100%' },

  tipMiniTag: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '900',
    fontSize: 12,
    textAlign: 'center',
  },

  tipTextCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(60,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.35)',
    padding: 12,
    justifyContent: 'center',
  },

  tipTextTitle: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 13,
    marginBottom: 6,
  },

  tipTextBody: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '800',
    fontSize: 14,
    lineHeight: 18,
  },

  tipBottomRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  roundBtnBig: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: { width: 22, height: 22 },
  iconSmall: { width: 18, height: 18 },

  sharePill: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginRight: 10,
  },

  shareText: {
    color: '#2b1200',
    fontWeight: '900',
    fontSize: 16,
    marginLeft: 8,
  },

  savedHint: {
    marginTop: 10,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(0,0,0,0.10)',
  },

  savedHintText: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '800',
    fontSize: 12,
  },

  backToGrid: {
    marginTop: 8,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.35)',
    backgroundColor: 'rgba(60,0,0,0.22)',
  },

  backToGridText: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 12,
  },

  taskPill: {
    minHeight: 46,
    borderRadius: 999,
    backgroundColor: 'rgba(60,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  taskPillActive: {
    borderColor: 'rgba(245,211,122,0.65)',
    backgroundColor: 'rgba(120,0,0,0.62)',
  },

  taskPillText: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '900',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },

  taskPillTextActive: { color: GOLD },

  taskBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    justifyContent: 'space-between',
  },

  chooseBtn: {
    flex: 1,
    height: 56,
    borderRadius: 999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  chooseText: {
    color: '#2b1200',
    fontWeight: '900',
    fontSize: 18,
  },

  taskSelectedPill: {
    minHeight: 46,
    borderRadius: 999,
    backgroundColor: 'rgba(120,0,0,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  taskSelectedText: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '900',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },

  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  timerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  timerGlyph: { color: '#2b1200', fontWeight: '900' },

  timerBox: {
    flex: 1,
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: 'rgba(120,0,0,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  timerText: { color: GOLD, fontWeight: '900', fontSize: 28, letterSpacing: 0.6 },

  taskControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  finishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});