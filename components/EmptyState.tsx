import { TouchableOpacity } from "react-native"
import { Text } from "react-native"
import { Image, View } from "react-native"

export const EmptyState = ({ handleAddFirstStash, heading, subHeading, label }: { handleAddFirstStash: () => void, heading?: string, subHeading?: string, label?: string }) => {
    return <View style={{ alignItems: 'center', marginTop: 32 }}>
      <View style={{ width: 180, height: 180, marginBottom: 18, justifyContent: 'center', alignItems: 'center' }}>
        <Image source={require('~/assets/images/empty-state-illustration.png')} style={{ width: 160, height: 160 }} resizeMode="contain" />
      </View>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#232c38', marginBottom: 6, textAlign: 'center' }}>
        {heading ? heading : 'Stashy looked around... nothing here yet!'}
      </Text>
      <Text style={{ fontSize: 15, color: '#666', marginBottom: 24, textAlign: 'center' }}>
        {subHeading ? subHeading : 'Try saving something — links, articles, or ideas.'}
      </Text>
      <TouchableOpacity
        style={{ backgroundColor: '#232c38', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 28, flexDirection: 'row', alignItems: 'center' }}
        onPress={handleAddFirstStash}
        activeOpacity={0.85}
      >
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginRight: 10 }}>＋</Text>
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 }}>{label ? label : "Add Your First Stash" }</Text>
      </TouchableOpacity>
    </View>
  }