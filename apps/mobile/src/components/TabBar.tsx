import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  Bell,
  Home,
  MessageCircle,
  Search,
  User,
  type LucideIcon,
} from 'lucide-react-native';

const ICON_MAP: Record<string, LucideIcon> = {
  index: Home,
  search: Search,
  chat: MessageCircle,
  notifications: Bell,
  profile: User,
};

export function TabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  // Hug the home indicator more tightly (don't reserve full inset).
  // For phones without home indicator (insets.bottom = 0), give a minimum 6 px.
  const bottomPad = insets.bottom > 0 ? Math.max(6, insets.bottom - 18) : 6;
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: 'rgba(11,31,68,0.06)',
        shadowColor: '#0B1F44',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 12,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 8,
          paddingTop: 6,
          paddingBottom: bottomPad,
        }}
      >
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const Icon = ICON_MAP[route.name] ?? Home;

            const label =
              typeof options.tabBarLabel === 'string'
                ? options.tabBarLabel
                : options.title ?? route.name;

            const badge = options.tabBarBadge;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name as never);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 2,
                }}
                android_ripple={{ color: 'rgba(22,44,102,0.08)', borderless: true, radius: 36 }}
              >
                {/* Active indicator pill */}
                <View
                  style={{
                    height: 36,
                    minWidth: 56,
                    paddingHorizontal: 14,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isFocused ? 'rgba(22,44,102,0.10)' : 'transparent',
                    position: 'relative',
                  }}
                >
                  <Icon
                    color={isFocused ? '#162C66' : '#94A3B8'}
                    size={22}
                    strokeWidth={isFocused ? 2.4 : 1.8}
                    fill={isFocused ? 'rgba(22,44,102,0.10)' : 'transparent'}
                  />

                  {/* Badge */}
                  {badge !== undefined ? (
                    <View
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 6,
                        minWidth: 18,
                        height: 18,
                        paddingHorizontal: 5,
                        borderRadius: 9,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#F5C400',
                        borderWidth: 2,
                        borderColor: '#FFFFFF',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '800',
                          color: '#0B1F44',
                          lineHeight: 11,
                        }}
                      >
                        {badge}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Label */}
                <Text
                  style={{
                    marginTop: 2,
                    fontSize: 10.5,
                    fontWeight: isFocused ? '800' : '600',
                    color: isFocused ? '#0B1F44' : '#94A3B8',
                    letterSpacing: 0.2,
                  }}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
      </View>
    </View>
  );
}
