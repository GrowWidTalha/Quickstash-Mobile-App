import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { StashArticle } from '~/app/(tabs)/home';
import { twMerge } from 'tailwind-merge';
import Tag from './Tag';
import { SvgFromXml } from 'react-native-svg';
import { svgIcons } from './CustomSvgIcons';
import { router } from 'expo-router';

interface UnreadStashListProps {
    articles: StashArticle[];
    onReadAll?: () => void;
}

const UnreadStashList: React.FC<UnreadStashListProps> = ({ articles, onReadAll }) => {
    return (
        <View className="mt-4 mb-2">
            <View className="flex-row items-center justify-between mb-2 px-0.5">
                <Text className="text-[22px] font-bold text-[#222]">Unread Stashes</Text>
                <TouchableOpacity onPress={onReadAll} activeOpacity={0.7}>
                    <Tag><Text className='text-xs text-[#49c8f1]'>
                        Read All</Text></Tag>
                </TouchableOpacity>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 0, paddingRight: 8 }}
            >
                {articles.map((article) => (
                    <TouchableOpacity key={article.id} activeOpacity={0.7} onPress={() => router.push(`/(details)/stash/${article.id}`)}>

                    <View
                        
                        className={twMerge(
                            "w-[240px] bg-[#f3f3f3] m-2 rounded-[18px] mr-4 overflow-hidden",
                            //   "elevation-3"
                        )}

                    >
                        <Image
                            source={{ uri: article.imageUrl }}
                            className="w-full h-[120px] rounded-t-[18px]"
                            resizeMode="cover"
                        />
                        <View className="px-[14px] pt-[14px] pb-2.5">
                            <Text numberOfLines={2} className="text-[17px] font-semibold text-[#222] mb-2.5">
                                {article.title}
                            </Text>
                            <View className="flex-row items-center mt-1">
                                <View className="flex-row items-center">
                                    <SvgFromXml xml={svgIcons.pen} color="#888" width={10} height={10} />
                                    <Text className="text-[#888] text-[13px] ml-1">{article.source}</Text>
                                </View>
                                <View className="w-3" />
                                <View className="flex-row items-center">
                                    <SvgFromXml xml={svgIcons.clock} color="#888" width={10} height={10} />
                                    <Text className="text-[#888] text-[13px] ml-1">{article.readTime} Min read</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    </TouchableOpacity>

                ))}
            </ScrollView>
        </View>
    );
};

export default UnreadStashList;