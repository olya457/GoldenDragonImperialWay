import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  useWindowDimensions,
  ScrollView,
  Pressable,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';

const BG = require('../assets/bg.png');
const HEADER_IMG = require('../assets/onboard1.png');

const AV_LEFT = require('../assets/avatar_left.png');
const AV_RIGHT = require('../assets/avatar_right.png');

const IC_SHARE = require('../assets/ic_share.png');

const REWARD_1 = require('../assets/reward_1.png');
const REWARD_2 = require('../assets/reward_2.png');
const REWARD_3 = require('../assets/reward_3.png');
const REWARD_4 = require('../assets/reward_4.png');
const REWARD_5 = require('../assets/reward_5.png');
const REWARD_6 = require('../assets/reward_6.png');
const REWARD_7 = require('../assets/reward_7.png');

const KEY_REWARDS = 'rewards_unlocked_v1';
const KEY_CHARACTER = 'selected_character_v1';

type RewardItem = { id: string; image: any; index: number };

const GOLD = '#f5d37a';

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function dateStrNow() {
  const d = new Date();
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export default function CollectionScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const isSmallH = height <= 700;
  const isTinyH = height <= 640;

  const topPad = insets.top;
  const bottomSafe = insets.bottom + tabBarHeight + (isTinyH ? 10 : 14);

  const [dateStr] = useState(() => dateStrNow());
  const [selectedCharacter, setSelectedCharacter] = useState<'empress' | 'emperor'>('empress');
  const chosenAvatar = selectedCharacter === 'empress' ? AV_LEFT : AV_RIGHT;

  const [unlocked, setUnlocked] = useState<boolean[]>(() => new Array(7).fill(false));

  const allRewards = useMemo<RewardItem[]>(
    () => [
      { id: 'r1', image: REWARD_1, index: 0 },
      { id: 'r2', image: REWARD_2, index: 1 },
      { id: 'r3', image: REWARD_3, index: 2 },
      { id: 'r4', image: REWARD_4, index: 3 },
      { id: 'r5', image: REWARD_5, index: 4 },
      { id: 'r6', image: REWARD_6, index: 5 },
      { id: 'r7', image: REWARD_7, index: 6 },
    ],
    []
  );

  const openedRewards = useMemo(() => allRewards.filter((r) => unlocked[r.index]), [allRewards, unlocked]);
  const openedCount = useMemo(() => unlocked.filter(Boolean).length, [unlocked]);

  const loadCharacter = useCallback(async () => {
    try {
      const v = await AsyncStorage.getItem(KEY_CHARACTER);
      if (v === 'empress' || v === 'emperor') setSelectedCharacter(v);
    } catch {}
  }, []);

  const loadRewards = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY_REWARDS);
      if (!raw) {
        setUnlocked(new Array(7).fill(false));
        return;
      }
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const normalized = new Array(7).fill(false).map((_, i) => Boolean(arr[i]));
        setUnlocked(normalized);
      } else {
        setUnlocked(new Array(7).fill(false));
      }
    } catch {
      setUnlocked(new Array(7).fill(false));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCharacter();
      loadRewards();
      return undefined;
    }, [loadCharacter, loadRewards])
  );

  useEffect(() => {
    loadCharacter();
    loadRewards();
  }, [loadCharacter, loadRewards]);

  const headerTitle = 'Welcome to Golden\nDragon Imperial Way';

  const cardW = Math.min(430, width - 26);
  const headerH = isTinyH ? 78 : isSmallH ? 88 : 94;
  const gap = isTinyH ? 10 : isSmallH ? 12 : 14;

  const gridGap = isTinyH ? 10 : 12;
  const gridPaddingX = 10;
  const cellW = Math.floor((cardW - gridPaddingX * 2 - gridGap) / 2);
  const cellH = Math.floor(cellW * 0.92);

  const onShareReward = useCallback(async (rewardNumber: number) => {
    try {
      await Share.share({ message: `I unlocked reward image #${rewardNumber}.` });
    } catch {}
  }, []);

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={{ flex: 1, paddingTop: topPad }}>
        <View style={styles.stage}>
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

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              width: cardW,
              paddingBottom: bottomSafe,
            }}
          >
            {openedCount === 0 ? (
              <View style={[styles.emptyCard, { marginTop: isTinyH ? 18 : 26 }]}>
                <View style={styles.emptyRow}>
                  <View style={styles.emptyAvatarWrap}>
                    <Image source={chosenAvatar} style={styles.emptyAvatarImg} resizeMode="contain" />
                  </View>

                  <Text style={[styles.emptyText, isTinyH && { fontSize: 13 }]} numberOfLines={3}>
                    You don&apos;t have a reward collection yet.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ paddingHorizontal: gridPaddingX, paddingTop: isTinyH ? 10 : 14 }}>
                <View style={[styles.grid, { columnGap: gridGap, rowGap: gridGap }]}>
                  {openedRewards.map((item) => {
                    const rewardNumber = item.index + 1;

                    return (
                      <View key={item.id} style={[styles.rewardCard, { width: cellW, height: cellH }]}>
                        <Image source={item.image} style={styles.rewardImg} resizeMode="cover" />

                        <Pressable
                          onPress={() => onShareReward(rewardNumber)}
                          style={({ pressed }) => [
                            styles.shareRound,
                            pressed && { transform: [{ scale: 0.98 }] },
                          ]}
                          hitSlop={12}
                        >
                          <Image source={IC_SHARE} style={styles.shareIcon} resizeMode="contain" />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>

                <Text style={styles.countHint}>Unlocked: {openedCount}/7</Text>
              </View>
            )}
          </ScrollView>
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

  emptyCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(40,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  emptyRow: { flexDirection: 'row', alignItems: 'center' },
  emptyAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(120,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 7,
    overflow: 'hidden',
    marginRight: 12,
  },
  emptyAvatarImg: { width: '100%', height: '100%' },
  emptyText: {
    flex: 1,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '800',
    fontSize: 14,
    lineHeight: 18,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  rewardCard: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.40)',
  },
  rewardImg: { width: '100%', height: '100%' },

  shareRound: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: { width: 16, height: 16 },

  countHint: {
    marginTop: 10,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.70)',
    fontWeight: '800',
    fontSize: 12,
  },
});