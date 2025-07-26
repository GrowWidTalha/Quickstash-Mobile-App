import { Link, router, Tabs } from "expo-router";

import { HeaderButton } from '../../components/HeaderButton';
import { TabBarIcon } from '../../components/TabBarIcon';
import { TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import AddButton from "~/components/AddButton";
import { svgIcons } from "~/components/CustomSvgIcons";
import { SvgXml } from "react-native-svg";
import { useStashDrawer } from "~/contexts/StashDrawerContext";
import theme from "~/constants/theme";

export default function TabLayout() {
  const { openDrawer } = useStashDrawer();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: 'black',
        tabBarStyle: {
          backgroundColor: theme.colors.neutral[500],
          borderTopWidth: 0,
          // shadowColor: "transparent"
        //   borderTopColor: "#D8D8D8",
          // height: 74,
        },
      }}>
      <Tabs.Screen
        name='home'
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <SvgXml xml={svgIcons.home} color={
            focused ? theme.colors.quickStashPrimary : theme.colors.tabBarAccent
          } />,
        }}
      />
      <Tabs.Screen
        name='saves'
        options={{
          title: 'Saves',
          tabBarIcon: ({ color, focused }) => <SvgXml xml={svgIcons.saves} color={
            focused ? theme.colors.quickStashPrimary : theme.colors.tabBarAccent
          }  />,
        }}
      />
      {/* Custom modal button in the middle */}
      <Tabs.Screen
        name="custom"
        options={
          {
            // href: null,
            title: "",
            headerShown: false,
            tabBarIcon: () => <AddButton />,
            // tabBarButton: (props) => <AddButton {...props} />,
          }
        }
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            openDrawer();
          }
        }}
      />
      <Tabs.Screen
        name='stats'
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => <SvgXml xml={svgIcons.stats} color={
            focused ? theme.colors.quickStashPrimary : theme.colors.tabBarAccent
          } />,
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <SvgXml xml={svgIcons.user} color={
            focused ? theme.colors.quickStashPrimary : theme.colors.tabBarAccent
          } />,
        }}
      />
    </Tabs>
  );
}

