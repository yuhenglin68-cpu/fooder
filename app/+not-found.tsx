import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { brand } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function NotFoundScreen() {
  const colors = useThemeColors();

  return (
    <>
      <Stack.Screen options={{ title: '页面不存在' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          🍳 这道菜还没做好
        </Text>
        <Link href="/" style={[styles.link, { color: brand.primary }]}>
          回到首页
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
});
