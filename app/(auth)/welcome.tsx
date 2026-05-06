import { View } from 'react-native';

import { Screen, Text } from '@/components/ui';

export default function WelcomeScreen() {
  return (
    <Screen>
      <View>
        <Text variant="hero">Welcome</Text>
      </View>
    </Screen>
  );
}
