import '../global.css';

import { Stack, useRouter, useSegments } from "expo-router";
import { ShareIntentProvider as NativeShareIntentProvider } from "expo-share-intent";
import { useEffect } from "react";
import { ShareHandler } from '../components/ShareHandler';
import StashDrawer from '../components/StashDrawer';
import { AuthProvider } from '../contexts/AuthContext';
import { SavesProvider } from '../contexts/SavesContext';
import { ShareIntentProvider, useCustomShareIntent } from '../contexts/ShareIntentContext';
import { StashDrawerProvider } from '../contexts/StashDrawerContext';
import { NavigationProvider } from '../contexts/NavigationContext';
import * as Linking from 'expo-linking';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://076c822a5e9b40c2bb7cdc14ac1e6385@o4510199198842880.ingest.us.sentry.io/4510199200284672',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});


function ShareHandlerWrapper() {
	//   const { isShareIntentVisible, hideShareIntent, sharedUrl } = useShareIntent();
	const { hideShareIntent, isShareIntentVisible, sharedUrl } =
		useCustomShareIntent();

	return (
		<ShareHandler
			isVisible={isShareIntentVisible}
			onClose={hideShareIntent}
			sharedUrl={sharedUrl || undefined}
		/>
	);
}

function DeepLinkHandler() {
	const router = useRouter();

	useEffect(() => {
		const handleDeepLink = (url: string) => {
			console.log('~ 🚀: Deep link received:', url);
			
			// Parse the URL to extract parameters
			const parsedUrl = Linking.parse(url);
			
			// Check if it's a password reset link
			if (parsedUrl.path === '/reset-password' && parsedUrl.queryParams) {
				const { access_token, refresh_token, type } = parsedUrl.queryParams;
				
				if (type === 'recovery' && access_token) {
					console.log('~ 🚀: Password reset deep link detected');
					// Navigate to reset password screen with the tokens
					router.push({
						pathname: '/(auth)/reset-password',
						params: {
							access_token: access_token as string,
							refresh_token: refresh_token as string,
							type: type as string,
						},
					});
				}
			}
		};

		// Handle initial URL if app was opened via deep link
		Linking.getInitialURL().then((url) => {
			if (url) {
				handleDeepLink(url);
			}
		});

		// Handle deep links while app is running
		const subscription = Linking.addEventListener('url', (event) => {
			handleDeepLink(event.url);
		});

		return () => subscription?.remove();
	}, [router]);

	return null;
}

export default Sentry.wrap(function RootLayout() {
	return (
		<NavigationProvider>
			<AuthProvider>
				<SavesProvider>
					<NativeShareIntentProvider>
						<ShareIntentProvider>
							<StashDrawerProvider>
								<DeepLinkHandler />
								<Stack screenOptions={{ headerShown: false }}>
									<Stack.Screen name="index" options={{ headerShown: false }} />
									<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
									<Stack.Screen name='(auth)' options={{ headerShown: false }} />
									<Stack.Screen name="(details)" options={{ headerShown: false }} />
								</Stack>
								<StashDrawer />
								<ShareHandlerWrapper />
							</StashDrawerProvider>
						</ShareIntentProvider>
					</NativeShareIntentProvider>
				</SavesProvider>
			</AuthProvider>
		</NavigationProvider>
	);
});