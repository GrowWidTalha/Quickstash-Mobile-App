import { Stack } from 'expo-router'

const DetailsLayout = () => {
  return (
    <Stack>
        <Stack.Screen name='stash/[id]' options={{ 
            headerShown: false
        }}/>
    </Stack>
  )
}

export default DetailsLayout
