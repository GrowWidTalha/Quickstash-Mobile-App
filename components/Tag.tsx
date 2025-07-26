import { View, Text } from 'react-native'
import React from 'react'

const Tag = ({children}: { children: React.ReactNode}) => {
  return (
    <View className='px-2 py-1 bg-[#e8f8f6] border border-[#49c8f1] rounded-full '>
      {children}
    </View>
  )
}

export default Tag