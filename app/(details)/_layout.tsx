import { Stack } from 'expo-router'
import { useNavigation } from '~/contexts/NavigationContext'

const DetailsLayout = () => {
  const { direction } = useNavigation()
  
  return (
    <Stack
      screenOptions={{
        // animation: direction === 'backward' ? 'slide_from_left' : 'slide_from_right',
        // gestureEnabled: true,
        // gestureDirection: 'horizontal',
      }}
    >
        <Stack.Screen 
          name='stash/[id]' 
          options={{ 
            headerShown: false,
            // animation: direction === 'backward' ? 'slide_from_left' : 'slide_from_right',
          }}
        />
    </Stack>
  )
}

export default DetailsLayout
