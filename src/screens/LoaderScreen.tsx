import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  Image,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Loader'>;

const BG = require('../assets/bg.png');
const LOGO = require('../assets/logo.png');

export default function LoaderScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();

  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const moveY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(moveY, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const t = setTimeout(() => {
      navigation.replace('Onboard');
    }, 5000);

    return () => clearTimeout(t);
  }, [navigation, fade, scale, moveY]);

  const isSmallH = height <= 700;
  const isSmallW = width <= 360;

  const logoSize = Math.round(
    Math.min(width * (isSmallW ? 0.38 : 0.44), isSmallH ? 140 : 190)
  );

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={styles.safe}>
        <Animated.View
          style={[
            styles.center,
            {
              opacity: fade,
              transform: [{ translateY: moveY }, { scale }],
            },
          ]}
        >
          <View style={[styles.logoWrap, { width: logoSize, height: logoSize }]}>
            <Image source={LOGO} style={styles.logo} resizeMode="cover" />
          </View>
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 28,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});