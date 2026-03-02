import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Choose'>;

const BG = require('../assets/bg.png');
const AV_LEFT = require('../assets/avatar_left.png');
const AV_RIGHT = require('../assets/avatar_right.png');

const KEY_CHARACTER = 'selected_character_v1';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function ChooseCharacterScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isTinyH = height <= 640;
  const isSmallH = height <= 700;
  const isSmallW = width <= 360;

  const topPad = Math.max(10, insets.top);
  const bottomPad = Math.max(10, insets.bottom);

  const cardW = Math.min(430, width - 26);
  const gap = isTinyH ? 10 : isSmallH ? 12 : 14;

  const headerH = isTinyH ? 58 : isSmallH ? 66 : 76;
  const headerRadius = isTinyH ? 18 : 22;

  const headerIcon = isTinyH ? 34 : isSmallH ? 38 : 44;
  const headerIconRadius = isTinyH ? 12 : 14;

  const titleSize = isTinyH ? 18 : isSmallH ? 20 : 22;
  const titleLine = isTinyH ? 20 : isSmallH ? 22 : 24;

  const stageH = height - topPad - bottomPad;

  const availableForCards = stageH - headerH - gap * 3;
  const minCardH = isTinyH ? 190 : isSmallH ? 220 : 260;
  const maxCardH = isTinyH ? 300 : isSmallH ? 340 : 410;

  const baseCardH = clamp(availableForCards / 2, minCardH, maxCardH);

  const cardH = Platform.OS === 'android' ? baseCardH - 20 : baseCardH;

  const cardRadius = isTinyH ? 22 : 26;

  const overlayH = isTinyH ? 48 : isSmallH ? 54 : 62;
  const overlayInset = isTinyH ? 12 : 14;

  const overlayPadL = isTinyH ? 14 : 16;
  const overlayPadR = isTinyH ? 10 : 12;

  const labelSize = isTinyH ? 18 : isSmallW ? 19 : 20;

  const arrowSize = isTinyH ? 38 : isSmallH ? 42 : 46;
  const arrowRadius = Math.floor(arrowSize / 2);

  const imageBoxHBase = cardH - (overlayInset * 2) - overlayH;
  const imageBoxH = Platform.OS === 'android'
    ? Math.max(60, imageBoxHBase - 20)
    : Math.max(60, imageBoxHBase);

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
          <View style={[styles.header, { width: cardW, height: headerH, borderRadius: headerRadius }]}>
            <View style={[styles.headerIconWrap, { width: headerIcon, height: headerIcon, borderRadius: headerIconRadius }]}>
              <Image source={AV_LEFT} style={styles.headerIcon} resizeMode="contain" />
            </View>

            <Text style={[styles.headerTitle, { fontSize: titleSize, lineHeight: titleLine }]}>
              Choose your{'\n'}character
            </Text>

            <View style={[styles.headerIconWrap, { width: headerIcon, height: headerIcon, borderRadius: headerIconRadius }]}>
              <Image source={AV_RIGHT} style={styles.headerIcon} resizeMode="contain" />
            </View>
          </View>
          <Pressable onPress={() => pick('empress')} style={({ pressed }) => [pressed && { transform: [{ scale: 0.99 }] }]}>
            <View style={[styles.card, { width: cardW, height: cardH, borderRadius: cardRadius }]}>
              <View style={[styles.imageBox, { height: imageBoxH }]}>
                <Image source={AV_LEFT} style={styles.cardImage} resizeMode="contain" />
              </View>

              <View
                style={[
                  styles.cardOverlay,
                  {
                    height: overlayH,
                    left: overlayInset,
                    right: overlayInset,
                    bottom: overlayInset,
                    paddingLeft: overlayPadL,
                    paddingRight: overlayPadR,
                    borderRadius: 999,
                  },
                ]}
              >
                <Text style={[styles.cardLabel, { fontSize: labelSize }]} numberOfLines={1} adjustsFontSizeToFit>
                  Empress (female)
                </Text>

                <View style={[styles.arrowBtn, { width: arrowSize, height: arrowSize, borderRadius: arrowRadius }]}>
                  <Text style={[styles.arrowText, { fontSize: isTinyH ? 22 : 24 }]}>{'→'}</Text>
                </View>
              </View>
            </View>
          </Pressable>

          <Pressable onPress={() => pick('emperor')} style={({ pressed }) => [pressed && { transform: [{ scale: 0.99 }] }]}>
            <View style={[styles.card, { width: cardW, height: cardH, borderRadius: cardRadius }]}>
              <View style={[styles.imageBox, { height: imageBoxH }]}>
                <Image source={AV_RIGHT} style={styles.cardImage} resizeMode="contain" />
              </View>

              <View
                style={[
                  styles.cardOverlay,
                  {
                    height: overlayH,
                    left: overlayInset,
                    right: overlayInset,
                    bottom: overlayInset,
                    paddingLeft: overlayPadL,
                    paddingRight: overlayPadR,
                    borderRadius: 999,
                  },
                ]}
              >
                <Text style={[styles.cardLabel, { fontSize: labelSize }]} numberOfLines={1} adjustsFontSizeToFit>
                  Emperor (male)
                </Text>

                <View style={[styles.arrowBtn, { width: arrowSize, height: arrowSize, borderRadius: arrowRadius }]}>
                  <Text style={[styles.arrowText, { fontSize: isTinyH ? 22 : 24 }]}>{'→'}</Text>
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
    backgroundColor: 'rgba(95, 10, 10, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(245, 211, 122, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },

  headerIconWrap: {
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },

  headerIcon: { width: '100%', height: '100%' },

  headerTitle: {
    color: '#fff',
    fontWeight: '900',
    textAlign: 'center',
    flexShrink: 1,
  },

  card: {
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(245, 211, 122, 0.85)',
  },

  imageBox: {
    backgroundColor: 'rgba(0,0,0,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },

  cardImage: {
    width: '100%',
    height: '100%',
  },

  cardOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(245, 211, 122, 0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  cardLabel: {
    color: '#f5d37a',
    fontWeight: '900',
    flex: 1,
    marginRight: 10,
  },

  arrowBtn: {
    backgroundColor: '#f5d37a',
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrowText: {
    fontWeight: '900',
    color: '#2b1200',
    marginTop: -1,
  },
});