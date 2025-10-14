
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
import * as Linking from 'expo-linking';


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

export default function RootLayout() {
	return (
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
