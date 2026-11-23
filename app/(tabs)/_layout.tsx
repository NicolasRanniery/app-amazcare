import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../src/theme/useAppTheme';

export default function TabLayout() {
  const { colors, scaleFont, isHighContrast } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: Math.max(72, scaleFont(70)),
            backgroundColor: colors.bgSurface,
            borderTopWidth: colors.borderWidth,
            borderTopColor: isHighContrast ? '#000000' : colors.borderSubtle,
          },
        ],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isHighContrast ? '#000000' : colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="hoje"
        options={{
          title: 'Hoje',
          tabBarLabel: ({ color }) => (
            <Text
              style={[
                styles.tabLabel,
                { color, fontSize: scaleFont(16) },
              ]}
            >
              Hoje
            </Text>
          ),
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <Text style={[styles.iconText, { fontSize: scaleFont(22) }]}>📅</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="remedios"
        options={{
          title: 'Remédios',
          tabBarLabel: ({ color }) => (
            <Text
              style={[
                styles.tabLabel,
                { color, fontSize: scaleFont(16) },
              ]}
            >
              Remédios
            </Text>
          ),
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <Text style={[styles.iconText, { fontSize: scaleFont(22) }]}>💊</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="estoque"
        options={{
          title: 'Estoque',
          tabBarLabel: ({ color }) => (
            <Text
              style={[
                styles.tabLabel,
                { color, fontSize: scaleFont(16) },
              ]}
            >
              Estoque
            </Text>
          ),
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <Text style={[styles.iconText, { fontSize: scaleFont(22) }]}>📦</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          title: 'Histórico',
          tabBarLabel: ({ color }) => (
            <Text
              style={[
                styles.tabLabel,
                { color, fontSize: scaleFont(16) },
              ]}
            >
              Histórico
            </Text>
          ),
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <Text style={[styles.iconText, { fontSize: scaleFont(22) }]}>📊</Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingBottom: 8,
    paddingTop: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {},
  tabLabel: {
    fontWeight: '700',
    marginTop: 2,
  },
});
