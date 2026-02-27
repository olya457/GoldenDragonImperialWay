import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Choose'>;

const BG = require('../assets/bg.png');

const AV_LEFT = require('../assets/avatar_left.png');   // Empress
const AV_RIGHT = require('../assets/avatar_right.png'); // Emperor

const KEY_CHARACTER = 'selected_character_v1';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function ChooseCharacterScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const cardW = Math.min(420, width - 34);

  const isSmallH = height <= 700;
  const isTinyH = height <= 640;

  const topPad = insets.top;
  const bottomPad = insets.bottom;

  const stageH = height - topPad - bottomPad;

  const gap = isTinyH ? 12 : isSmallH ? 14 : 18;

  const headerH = isTinyH ? 64 : isSmallH ? 72 : 82;
  const iconSize = isTinyH ? 40 : isSmallH ? 46 : 52;

  const overlayH = isTinyH ? 46 : isSmallH ? 52 : 58;

  const titleSize = isTinyH ? 18 : isSmallH ? 20 : 24;
  const titleLine = isTinyH ? 20 : isSmallH ? 22 : 26;

  const availableForCards = stageH - headerH - gap * 3;
  const cardH = clamp(availableForCards / 2, 190, 290);

  const pick = useCallback(
    async (v: 'empress' | 'emperor') => {
      try {
        await AsyncStorage.setItem(KEY_CHARACTER, v);
      } catch {}
      navigation.replace('MainTabs');
    },
    [navigation]
  );

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={[styles.safe, { paddingTop: topPad, paddingBottom: bottomPad }]}>
        <View style={[styles.stage, { gap }]}>
          <View style={[styles.header, { width: cardW, height: headerH }]}>
            <View style={[styles.headerIconWrap, { width: iconSize, height: iconSize }]}>
              <Image source={AV_LEFT} style={styles.headerIcon} resizeMode="contain" />
            </View>

            <Text style={[styles.headerTitle, { fontSize: titleSize, lineHeight: titleLine }]}>
              Choose your{'\n'}character
            </Text>

            <View style={[styles.headerIconWrap, { width: iconSize, height: iconSize }]}>
              <Image source={AV_RIGHT} style={styles.headerIcon} resizeMode="contain" />
            </View>
          </View>

          <Pressable
            onPress={() => pick('empress')}
            style={({ pressed }) => [pressed && { transform: [{ scale: 0.99 }] }]}
          >
            <View style={[styles.card, { width: cardW, height: cardH }]}>
              <View style={styles.imageBox}>
                <Image source={AV_LEFT} style={styles.cardImage} resizeMode="contain" />
              </View>

              <View style={[styles.cardOverlay, { height: overlayH }]}>
                <Text style={[styles.cardLabel, isTinyH && { fontSize: 16 }]}>Empress (female)</Text>
                <View style={[styles.arrowBtn, isTinyH && { width: 38, height: 38, borderRadius: 19 }]}>
                  <Text style={[styles.arrowText, isTinyH && { fontSize: 20 }]}>→</Text>
                </View>
              </View>
            </View>
          </Pressable>

          <Pressable
            onPress={() => pick('emperor')}
            style={({ pressed }) => [pressed && { transform: [{ scale: 0.99 }] }]}
          >
            <View style={[styles.card, { width: cardW, height: cardH }]}>
              <View style={styles.imageBox}>
                <Image source={AV_RIGHT} style={styles.cardImage} resizeMode="contain" />
              </View>

              <View style={[styles.cardOverlay, { height: overlayH }]}>
                <Text style={[styles.cardLabel, isTinyH && { fontSize: 16 }]}>Emperor (male)</Text>
                <View style={[styles.arrowBtn, isTinyH && { width: 38, height: 38, borderRadius: 19 }]}>
                  <Text style={[styles.arrowText, isTinyH && { fontSize: 20 }]}>→</Text>
                </View>
              </View>
            </View>
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
    justifyContent: 'center',
  },

  header: {
    borderRadius: 22,
    backgroundColor: 'rgba(95, 10, 10, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(245, 211, 122, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },

  headerIconWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },

  headerIcon: {
    width: '100%',
    height: '100%',
  },

  headerTitle: {
    color: '#fff',
    fontWeight: '900',
    textAlign: 'center',
  },

  card: {
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(245, 211, 122, 0.85)',
  },

  imageBox: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: 'rgba(0,0,0,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardImage: {
    width: '100%',
    height: '100%',
  },

  cardOverlay: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(245, 211, 122, 0.55)',
    paddingLeft: 14,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  cardLabel: {
    color: '#f5d37a',
    fontSize: 18,
    fontWeight: '900',
  },

  arrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5d37a',
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrowText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2b1200',
    marginTop: -1,
  },
});