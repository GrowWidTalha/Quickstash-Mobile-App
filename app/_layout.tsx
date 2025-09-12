
import '../global.css';

import { Stack } from "expo-router";
import { ShareIntentProvider as NativeShareIntentProvider } from "expo-share-intent";
import { ShareHandler } from '../components/ShareHandler';
import StashDrawer from '../components/StashDrawer';
import { AuthProvider } from '../contexts/AuthContext';
import { SavesProvider } from '../contexts/SavesContext';
import { ShareIntentProvider, useCustomShareIntent } from '../contexts/ShareIntentContext';
import { StashDrawerProvider } from '../contexts/StashDrawerContext';


function ShareHandlerWrapper() {
	//   const { isShareIntentVisible, hideShareIntent, sharedUrl } = useShareIntent();
	const { hideShareIntent, isShareIntentVisible, sharedUrl } =
		useCustomShareIntent();

	return (
		<ShareHandler
			isVisible={isShareIntentVisible}
			onClose={hideShareIntent}
			sharedUrl={sharedUrl}
		/>
	);
}

export default function RootLayout() {
	return (
		<AuthProvider>
			<SavesProvider>
				<NativeShareIntentProvider>

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
				</NativeShareIntentProvider>

			</SavesProvider>
		</AuthProvider>
	);
}
