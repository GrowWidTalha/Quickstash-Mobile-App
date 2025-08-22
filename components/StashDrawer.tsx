import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Pressable, ActivityIndicator, Image, ScrollView, Keyboard } from 'react-native';
import { StashDrawerContext } from '../contexts/StashDrawerContext';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSaves } from '~/contexts/SavesContext';
import { useAuth } from '~/contexts/AuthContext';

const TAGS = ['Tech', 'Reactjs', 'Programming', 'Writing', 'Psychology'];

const StashDrawer = () => {
  const { addSave } = useSaves();
  const { isOpen, closeDrawer } = useContext(StashDrawerContext)!;
  const [visible, setVisible] = useState(false);
  const [url, setUrl] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const translateY = useSharedValue(400);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setSuccess(false);
      setError(null);
      setUrl('');
      setSelectedTags([]);
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });
    } else if (visible) {
      translateY.value = withTiming(400, { duration: 300 });
      opacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) runOnJS(setVisible)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleTagPress = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleStash = async () => {
    console.log("running te te te")
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await addSave(url);
      if (result.success) {
        setSuccess(true);
        setUrl('');
        setSelectedTags([]);
        // Optionally close drawer after a delay
        setTimeout(() => {
          closeDrawer();
          setSuccess(false);
        }, 1500);
      } else {
        setError(result.error || 'Failed to add stash.');
      }
    } catch (e: any) {
      setError(e?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <>
      {/* Blurred overlay */}
      <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer}>
        <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
      </Pressable>
      {/* Bottom sheet */}
      <Animated.View 
        style={[
          styles.sheet, 
          animatedSheetStyle,
          { bottom: keyboardHeight > 0 ? keyboardHeight : 0 }
        ]}
      >
        <View style={styles.handle} />
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {success ? (
            <View style={styles.successContainer}>
              <Text style={styles.successTitle}>New Stash Added <Text style={styles.successIcon}>✅</Text></Text>
              <Image 
                source={require('~/assets/images/stashed-success-illustration.png')} 
                style={styles.successImage} 
                resizeMode="contain" 
              />
              <Text style={styles.successText}>Stashed successfully</Text>
            </View>
          ) : (
            <View style={styles.contentContainer}>
              <Text style={styles.title}>Add a New Stash</Text>
              <Text style={styles.subtitle}>Save a link, article, or idea you want to revisit later.</Text>
              <Text style={styles.label}>URL</Text>
              <View style={styles.inputRow}>
                <Text style={styles.linkIcon}>🔗</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://x.com/..."
                  placeholderTextColor="#b0b0b0"
                  value={url}
                  onChangeText={setUrl}
                  editable={!loading}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="done"
                />
              </View>
              {error && <Text style={styles.errorText}>{error}</Text>}
              <TouchableOpacity
                style={[styles.stashButton, loading && styles.stashButtonDisabled]}
                onPress={handleStash}
                disabled={loading || !url.trim()}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.stashButtonText}>＋  Stash</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 200,
    maxHeight: '70%', // Reduced max height
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 36,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
    marginTop: 16,
    marginBottom: 16,
  },
  successContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successIcon: {
    fontSize: 18,
  },
  successImage: {
    width: 140,
    height: 140,
    marginBottom: 12,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#232c38',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#222',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 18,
  },
  label: {
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  linkIcon: {
    fontSize: 18,
    marginRight: 8,
    color: '#b0b0b0',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    paddingVertical: 4,
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  tag: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  tagActive: {
    backgroundColor: '#e6f0fa',
    borderColor: '#90caf9',
  },
  tagInactive: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  tagText: {
    fontSize: 13,
  },
  tagTextActive: {
    color: '#1976d2',
    fontWeight: '600',
  },
  tagTextInactive: {
    color: '#aaa',
  },
  stashButton: {
    backgroundColor: '#232c38',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  stashButtonDisabled: {
    opacity: 0.7,
  },
  stashButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default StashDrawer;