import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, type ColorValue } from 'react-native';
import { colors } from '@/lib/theme';

function TabGlyph({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ color, fontSize: 18 }}>{glyph}</Text>;
}

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand,
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ color }) => <TabGlyph glyph="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t('common.viewMap'),
          tabBarIcon: ({ color }) => <TabGlyph glyph="🗺️" color={color} />,
        }}
      />
      <Tabs.Screen
        name="prayer"
        options={{
          title: t('nav.prayerTimes'),
          tabBarIcon: ({ color }) => <TabGlyph glyph="🕌" color={color} />,
        }}
      />
      <Tabs.Screen
        name="qibla"
        options={{
          title: t('nav.qibla'),
          tabBarIcon: ({ color }) => <TabGlyph glyph="🧭" color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: t('nav.saved'),
          tabBarIcon: ({ color }) => <TabGlyph glyph="★" color={color} />,
        }}
      />
    </Tabs>
  );
}
