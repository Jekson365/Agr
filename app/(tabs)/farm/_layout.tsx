import { Stack } from 'expo-router';

export default function FarmLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="land/index" />
      <Stack.Screen name="livestock/index" />
      <Stack.Screen name="stock/index" />
      <Stack.Screen name="fruits/index" />
      <Stack.Screen name="balance/index" />
      <Stack.Screen name="equipment/index" />
      <Stack.Screen name="livestock/[id]" />
      <Stack.Screen name="history/[stockId]" />
      <Stack.Screen name="stock-history/[stockId]" />
      <Stack.Screen name="tree-stock-history/[treeStockId]" />
      <Stack.Screen name="land/[id]" />
      <Stack.Screen name="upgrade" />
    </Stack>
  );
}
