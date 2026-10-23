import '@/src/theme/global-font';

import { Provider as AntdProvider } from '@ant-design/react-native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeOut } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/src/i18n';
import { AppSplash } from '@/src/components/app-splash';
import { BrandProvider } from '@/src/branding/brand-context';
import { DisplayProvider } from '@/src/display/display-store';
import { StationSyncProvider } from '@/src/display/station-sync';
import { PairingProvider } from '@/src/pairing/pairing-store';
import { harmonyFontMap } from '@/src/theme/harmony-fonts';
import { AppThemeContext, appLightTheme } from '@/src/theme/use-theme';

// giữ splash native cho tới khi AppSplash (ảnh nền) sẵn sàng, tránh chớp nền trắng/đen
SplashScreen.preventAutoHideAsync().catch(() => {});

const SPLASH_MIN_MS = 1500;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    antoutline: require('@ant-design/icons-react-native/fonts/antoutline.ttf'),
    antfill: require('@ant-design/icons-react-native/fonts/antfill.ttf'),
    ...harmonyFontMap,
  });
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMinElapsed(true), SPLASH_MIN_MS);
    return () => clearTimeout(id);
  }, []);

  if (!fontsLoaded) return <AppSplash />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeContext.Provider value={appLightTheme}>
          <AntdProvider theme={appLightTheme}>
            <PairingProvider>
              <BrandProvider>
                <DisplayProvider>
                  <StationSyncProvider>
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: appLightTheme.fill_body },
                      }}>
                      <Stack.Screen name="index" />
                    </Stack>
                    <StatusBar hidden />
                    {minElapsed ? null : (
                      <Animated.View
                        exiting={FadeOut.duration(400)}
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none">
                        <AppSplash />
                      </Animated.View>
                    )}
                  </StationSyncProvider>
                </DisplayProvider>
              </BrandProvider>
            </PairingProvider>
          </AntdProvider>
        </AppThemeContext.Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
