import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'onboarding_completed';

/**
 * Check if the user has completed the onboarding flow
 */
export const hasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
    return completed === 'true';
  } catch (error) {
    console.warn('Failed to check onboarding status:', error);
    return false;
  }
};

/**
 * Mark onboarding as completed
 */
export const setOnboardingCompleted = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    console.log('~ 🚀: Onboarding marked as completed');
  } catch (error) {
    console.error('Failed to set onboarding completed:', error);
  }
};

/**
 * Reset onboarding status (for replay functionality)
 */
export const resetOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    console.log('~ 🚀: Onboarding status reset');
  } catch (error) {
    console.error('Failed to reset onboarding:', error);
  }
};
