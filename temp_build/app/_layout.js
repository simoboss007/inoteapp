import { Stack } from 'expo-router';
import { ThemeProvider } from '../src/context/ThemeContext';
import { ColorProvider } from '../src/context/ColorContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ColorProvider>
          <SafeAreaProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
          </SafeAreaProvider>
        </ColorProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
