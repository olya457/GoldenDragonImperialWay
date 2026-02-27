// ChangeCharacterScreen.tsx

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

const GOLD = '#f5d37a';
const BROWN = '#2b1200';

export default function ChangeCharacterScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [selectedCharacter, setSelectedCharacter] = useState<'empress' | 'emperor'>('empress');
  const [dateStr] = useState(() => dateStrNow());

  const isSmallH = height <= 700;
  const isTinyH = height <= 640;

  const cardW = Math.min(430, width - 26);
  const headerH = isTinyH ? 78 : isSmallH ? 88 : 94;

  const chosenAvatar = useMemo(
    () => (selectedCharacter === 'empress' ? AV_LEFT : AV_RIGHT),
    [selectedCharacter]
  );

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(KEY_CHARACTER);
        if (v === 'empress' || v === 'emperor') {
          setSelectedCharacter(v);
        }
      } catch {}
    })();
  }, []);

  const onYes = useCallback(() => {
    // Переход в RootStack
    navigation.getParent()?.navigate('Choose' as never);
  }, [navigation]);

  const onNo = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const headerTitle = 'Welcome to Golden\nDragon Imperial Way';

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.stage}>
          {/* Header */}
          <View style={[styles.headerCard, { width: cardW, height: headerH }]}>
            <View style={styles.headerLeft}>
              <View style={styles.headerThumbWrap}>
                <Image source={HEADER_IMG} style={styles.headerThumb} resizeMode="cover" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>{headerTitle}</Text>
                <Text style={styles.headerDate}>{dateStr}</Text>
              </View>
            </View>

            <View style={styles.headerDot} />
          </View>

          <View style={{ height: 26 }} />

          {/* Question Card */}
          <View style={[styles.questionCard, { width: cardW }]}>
            <View style={styles.questionRow}>
              <View style={styles.avatarWrap}>
                <Image source={chosenAvatar} style={styles.avatarImg} resizeMode="contain" />
              </View>

              <Text style={styles.questionText}>
                Do you want to change your character?
              </Text>
            </View>
          </View>

          <View style={{ height: 22 }} />

          {/* YES */}
          <Pressable
            onPress={onYes}
            style={({ pressed }) => [
              styles.goldBtn,
              { width: cardW, height: 54 },
              pressed && { transform: [{ scale: 0.99 }] },
            ]}
          >
            <Text style={styles.goldBtnText}>Yes</Text>
          </Pressable>

          <View style={{ height: 16 }} />

          {/* NO */}
          <Pressable
            onPress={onNo}
            style={({ pressed }) => [
              styles.goldBtn,
              { width: cardW, height: 54 },
              pressed && { transform: [{ scale: 0.99 }] },
            ]}
          >
            <Text style={styles.goldBtnText}>No</Text>
          </Pressable>
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

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerThumbWrap: {
    width: 58,
    height: 58,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 10,
  },

  headerThumb: {
    width: '100%',
    height: '100%',
  },

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

  questionCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(40,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.35)',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(120,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    marginRight: 12,
  },

  avatarImg: {
    width: '100%',
    height: '100%',
  },

  questionText: {
    flex: 1,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '800',
    fontSize: 15,
    lineHeight: 20,
  },

  goldBtn: {
    borderRadius: 999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },

  goldBtnText: {
    color: BROWN,
    fontWeight: '900',
    fontSize: 18,
  },
});