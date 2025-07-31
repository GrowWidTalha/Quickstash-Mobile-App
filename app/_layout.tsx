
import '../global.css';

import { Stack } from "expo-router";
import { StashDrawerProvider } from '../contexts/StashDrawerContext';
import StashDrawer from '../components/StashDrawer';
import { AuthProvider } from '../contexts/AuthContext';
import { SavesProvider } from '../contexts/SavesContext';


export default function RootLayout() {
	return (
		<AuthProvider>
			<SavesProvider>
				<StashDrawerProvider>
					<Stack screenOptions={{ headerShown: false }}>
						<Stack.Screen name="index" options={{ headerShown: false }} />
						<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
						<Stack.Screen name='(auth)' options={{ headerShown: false }} />
					</Stack>
					<StashDrawer />
				</StashDrawerProvider>
			</SavesProvider>
		</AuthProvider>
	);
}
