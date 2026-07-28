import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type ViewerImage = {
  uri: string;
  caption?: string;
};

type Props = {
  visible: boolean;
  images: ViewerImage[];
  initialIndex: number;
  onClose: () => void;
};

/** Full-screen swipeable image viewer, e.g. for opening a photo grid at full size. */
export function FullScreenImageViewer({ visible, images, initialIndex, onClose }: Props) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!width) return;
    setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  }

  const activeCaption = images[activeIndex]?.caption;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <FlatList
            style={styles.list}
            data={images}
            keyExtractor={(item, index) => `${item.uri}-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialIndex}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <View style={{ width, height: '100%' }}>
                <Image source={{ uri: item.uri }} style={styles.image} contentFit="contain" />
              </View>
            )}
          />
        )}

        <SafeAreaView style={styles.topBar} edges={['top']}>
          <Pressable
            style={styles.closeButton}
            hitSlop={12}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close">
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
        </SafeAreaView>

        {(activeCaption || images.length > 1) && (
          <SafeAreaView style={styles.bottomBar} edges={['bottom']} pointerEvents="none">
            {images.length > 1 && (
              <View style={styles.dotsRow}>
                {images.map((_, index) => (
                  <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
                ))}
              </View>
            )}
            {activeCaption ? (
              <View style={styles.captionPill}>
                <Text style={styles.caption}>{activeCaption}</Text>
              </View>
            ) : null}
          </SafeAreaView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000',
  },
  list: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 16,
    gap: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 16,
  },
  captionPill: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  caption: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
