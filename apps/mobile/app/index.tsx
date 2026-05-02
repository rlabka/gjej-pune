import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Gate screen — decides where to send the user based on session state.
 * This runs immediately after the root layout hydrates.
 */
export default function Index() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#162C66" />
      </View>
    );
  }

  return <Redirect href={(session ? '/(tabs)' : '/welcome') as any} />;
}
