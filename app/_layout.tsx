
import '../global.css';

import { Stack } from "expo-router";
import { StashDrawerProvider } from '../contexts/StashDrawerContext';
import StashDrawer from '../components/StashDrawer';
import { AuthProvider } from '../contexts/AuthContext';
import { SavesProvider } from '../contexts/SavesContext';
import { ShareIntentProvider } from '../contexts/ShareIntentContext';
import { ShareHandler } from '../components/ShareHandler';
import { useShareIntent } from '../contexts/ShareIntentContext';

function ShareHandlerWrapper() {
  const { isShareIntentVisible, hideShareIntent, sharedUrl } = useShareIntent();
  
  return (
    <ShareHandler
      isVisible={isShareIntentVisible}
      onClose={hideShareIntent}
      sharedUrl={sharedUrl || undefined}
    />
  );
}

export default function RootLayout() {
	return (
		<AuthProvider>
			<SavesProvider>
				<ShareIntentProvider>
					<StashDrawerProvider>
						<Stack screenOptions={{ headerShown: false }}>
							<Stack.Screen name="index" options={{ headerShown: false }} />
							<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
							<Stack.Screen name='(auth)' options={{ headerShown: false }} />
						</Stack>
						<StashDrawer />
						<ShareHandlerWrapper />
					</StashDrawerProvider>
				</ShareIntentProvider>
			</SavesProvider>
		</AuthProvider>
	);
}
