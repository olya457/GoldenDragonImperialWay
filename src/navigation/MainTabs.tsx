import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { MainTabParamList } from './types';

import HomeDailyTipsScreen from '../screens/HomeDailyTipsScreen';
import SavedNoDataScreen from '../screens/SavedNoDataScreen';
import AdvisorsScreen from '../screens/AdvisorsScreen';
import GameScreen from '../screens/GameScreen';
import CollectionScreen from '../screens/CollectionScreen';
import ChangeCharacterScreen from '../screens/ChangeCharacterScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.barWrap}>
      <View style={styles.bar}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          const label =
            descriptors[route.key]?.options?.tabBarLabel ??
            descriptors[route.key]?.options?.title ??
            route.name;

          return (
            <Pressable key={route.key} onPress={onPress} style={[styles.tabBtn, isFocused && styles.tabBtnActive]}>
              <Text style={[styles.tabText, isFocused && styles.tabTextActive]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tab.Screen name="HomeDailyTips" component={HomeDailyTipsScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="SavedNoData" component={SavedNoDataScreen} options={{ tabBarLabel: 'Saved' }} />
      <Tab.Screen name="Advisors" component={AdvisorsScreen} options={{ tabBarLabel: 'Advisors' }} />
      <Tab.Screen name="Game" component={GameScreen} options={{ tabBarLabel: 'Game' }} />
      <Tab.Screen name="Collection" component={CollectionScreen} options={{ tabBarLabel: 'Collection' }} />
      <Tab.Screen name="ChangeCharacter" component={ChangeCharacterScreen} options={{ tabBarLabel: 'Character' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 14,
    alignItems: 'center',
  },
  bar: {
    width: '92%',
    height: 64,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E7E7E7',
  },
  tabBtn: {
    flex: 1,
    height: 52,
    marginHorizontal: 4,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#111111',
  },
  tabText: {
    fontSize: 12,
    color: '#111111',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
  },
});