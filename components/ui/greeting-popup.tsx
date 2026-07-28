import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_DISTANCE_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 800;

/** Shown once right after login/register — swipe it left/right, or tap the dark backdrop, to dismiss. */
export function GreetingPopup({ visible, onClose }: Props) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const translateX = useSharedValue(0);

  // Reset position each time the popup is (re)opened, e.g. after a previous swipe-dismiss.
  useEffect(() => {
    if (visible) {
      translateX.value = 0;
    }
  }, [visible, translateX]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const pastDistance = Math.abs(event.translationX) > SWIPE_DISTANCE_THRESHOLD;
      const pastVelocity = Math.abs(event.velocityX) > SWIPE_VELOCITY_THRESHOLD;
      if (pastDistance || pastVelocity) {
        const direction = event.translationX >= 0 ? 1 : -1;
        translateX.value = withTiming(direction * SCREEN_WIDTH, { duration: 220 }, (finished) => {
          if (finished) {
            scheduleOnRN(onClose);
          }
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: 1 - Math.min(Math.abs(translateX.value) / SCREEN_WIDTH, 1) * 0.7,
  }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.content, animatedStyle]}>
            <View style={styles.bubble}>
              <Text style={styles.greetingText}>
                {t('dashboard.greetingPopupMessage', { name: user?.name ?? '' })}
              </Text>
            </View>
            <Image source={require('@/assets/mascot/greeting.png')} style={styles.mascot} contentFit="contain" />
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 56,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    marginRight: -12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  greetingText: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.dark,
    lineHeight: 21,
  },
  mascot: {
    width: 130,
    height: 130,
  },
});
