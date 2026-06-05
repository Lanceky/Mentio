import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { PreferencesProvider } from "@/providers/preferences";

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="teach" />
      </Stack>
      <StatusBar style="dark" />
    </PreferencesProvider>
  );
}
