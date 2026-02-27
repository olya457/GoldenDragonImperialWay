import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Pressable,
  FlatList,
  Image,
  Share,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../navigation/types';

const BG = require('../assets/bg.png');
const HEADER_IMG = require('../assets/onboard1.png');

const AV_LEFT = require('../assets/avatar_left.png');
const AV_RIGHT = require('../assets/avatar_right.png');

const IC_SHARE = require('../assets/ic_share.png');
const IC_X = require('../assets/ic_x.png');

type Props = BottomTabScreenProps<MainTabParamList, 'SavedNoData'>;

type SavedTipItem = {
  id: string;
  categoryId: string;
  categoryTitle: string;
  text: string;
  createdAt: number;
};

const KEY_SAVED_TIPS = 'saved_tips_v1';
const KEY_CHARACTER = 'selected_character_v1';

const GOLD = '#f5d37a';
const BROWN = '#2b1200';

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export default function SavedNoDataScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const cardW = Math.min(430, width - 26);
  const isSmallH = height <= 700;

  const [items, setItems] = useState<SavedTipItem[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<'empress' | 'emperor'>('empress');

  const chosenAvatar = selectedCharacter === 'empress' ? AV_LEFT : AV_RIGHT;

  const readCharacter = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY_CHARACTER);
      const v = (raw ?? '').trim();
      if (v === 'empress' || v === 'emperor') {
        setSelectedCharacter(v);
      } else {
        setSelectedCharacter('empress');
      }
    } catch {
      setSelectedCharacter('empress');
    }
  }, []);

  const loadSaved = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY_SAVED_TIPS);
      const arr = raw ? JSON.parse(raw) : [];
      setItems(Array.isArray(arr) ? arr : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    readCharacter();
    loadSaved();
  }, [readCharacter, loadSaved]);

  useFocusEffect(
    useCallback(() => {
      readCharacter();
      loadSaved();
      return undefined;
    }, [readCharacter, loadSaved])
  );

  const clearAll = useCallback(async () => {
    try {
      setItems([]);
      await AsyncStorage.setItem(KEY_SAVED_TIPS, JSON.stringify([]));
    } catch {}
  }, []);

  const removeOne = useCallback(
    async (id: string) => {
      try {
        const next = items.filter((x) => x.id !== id);
        setItems(next);
        await AsyncStorage.setItem(KEY_SAVED_TIPS, JSON.stringify(next));
      } catch {}
    },
    [items]
  );

  const shareOne = useCallback(async (item: SavedTipItem) => {
    try {
      await Share.share({ message: item.text });
    } catch {}
  }, []);

  const dateStr = useMemo(() => {
    const d = new Date();
    return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
  }, []);

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View style={[styles.stage, { marginTop: -10 }]}>
          <View style={[styles.headerCard, { width: cardW }]}>
            <View style={styles.headerLeft}>
              <View style={styles.headerThumbWrap}>
                <Image source={HEADER_IMG} style={styles.headerThumb} resizeMode="cover" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>
                  Welcome to Golden{'\n'}Dragon Imperial Way
                </Text>
                <Text style={styles.headerDate}>{dateStr}</Text>
              </View>
            </View>

            <View style={styles.headerDot} />
          </View>

          <View style={[styles.topRow, { width: cardW }]}>
            <Text style={styles.title}>Saved</Text>

            {items.length > 0 ? (
              <Pressable onPress={clearAll} style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.9 }]}>
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            ) : (
              <View style={{ width: 64 }} />
            )}
          </View>

          {items.length === 0 ? (
            <View style={[styles.emptyCard, { width: cardW }]}>
              <View style={styles.emptyRow}>
                <View style={styles.emptyAvatarWrap}>
                  <Image source={chosenAvatar} style={styles.emptyAvatarImg} resizeMode="contain" />
                </View>

                <Text style={styles.emptyText}>You have no saved tips yet.</Text>
              </View>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(it) => it.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: isSmallH ? 10 : 18 }}
              style={{ width: cardW }}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
                      <Text style={styles.cardCat} numberOfLines={1}>
                        {item.categoryTitle}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => removeOne(item.id)}
                      style={({ pressed }) => [styles.removeBtn, pressed && { transform: [{ scale: 0.98 }] }]}
                    >
                      <Image source={IC_X} style={styles.removeIcon} resizeMode="contain" />
                    </Pressable>
                  </View>

                  <Text style={styles.cardText} numberOfLines={3}>
                    {item.text}
                  </Text>

                  <Pressable
                    onPress={() => shareOne(item)}
                    style={({ pressed }) => [styles.sharePill, pressed && { transform: [{ scale: 0.99 }] }]}
                  >
                    <Image source={IC_SHARE} style={styles.shareIcon} resizeMode="contain" />
                    <Text style={styles.shareText}>Share</Text>
                  </Pressable>
                </View>
              )}
            />
          )}
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
    marginBottom: 12,
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
    fontSize: 16,
    lineHeight: 18,
  },

  headerDate: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '700',
    fontSize: 12,
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

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  title: { color: '#fff', fontWeight: '900', fontSize: 22 },

  clearBtn: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(245,211,122,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearText: { color: BROWN, fontWeight: '900' },

  emptyCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(40,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginTop: 190,
  },

  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  emptyAvatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(120,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  emptyAvatarImg: {
    width: 64,
    height: 64,
  },

  emptyText: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '800',
    fontSize: 16,
    lineHeight: 20,
  },

  card: {
    borderRadius: 18,
    backgroundColor: 'rgba(40,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    padding: 12,
    marginBottom: 12,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },

  cardDate: { color: GOLD, fontWeight: '900', fontSize: 12 },
  cardCat: { marginTop: 2, color: 'rgba(255,255,255,0.85)', fontWeight: '900', fontSize: 13 },

  removeBtn: {
    width: 40,
    height: 34,
    borderRadius: 999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },

  removeIcon: { width: 16, height: 16 },

  cardText: { color: 'rgba(255,255,255,0.92)', fontWeight: '800', lineHeight: 18 },

  sharePill: {
    marginTop: 12,
    height: 40,
    borderRadius: 999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  shareIcon: { width: 18, height: 18 },
  shareText: { color: BROWN, fontWeight: '900', fontSize: 14 },
});