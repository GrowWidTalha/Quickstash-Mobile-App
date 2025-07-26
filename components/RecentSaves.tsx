import React from 'react';
import { View, Text, Image, TouchableOpacity, Touchable } from 'react-native';
import { StashArticle } from '~/app/(tabs)/home';
import Tag from './Tag';
import { SvgFromXml } from 'react-native-svg';
import { svgIcons } from './CustomSvgIcons';
import { router } from 'expo-router';

interface RecentSavesProps {
    articles: StashArticle[];
    onReadAll?: () => void;
    label?: string,
    showMoreButton?: boolean
}

const RecentSaves: React.FC<RecentSavesProps> = ({ articles, onReadAll, label, showMoreButton }) => {
    return (
        <View className="mt-5 mb-2">
            <View className="flex-row items-center justify-between mb-2 px-0.5">
                <Text className="text-[24px] font-bold text-[#222]">{label ? label : "Recent Saves"}</Text>
                {showMoreButton && (
                    <TouchableOpacity onPress={onReadAll} activeOpacity={0.7}>
                        <Tag><Text className='text-xs text-[#49c8f1]'>Read All</Text></Tag>
                    </TouchableOpacity>

                )}
            </View>
            <View className="space-y-4">
                {articles.map((article) => (
                    <TouchableOpacity key={article.id} activeOpacity={0.7} onPress={() => router.push(`/(details)/stash/${article.id}`)}>

                        <View  className="flex-row items-center bg-[#f3f3f3] rounded-[22px] p-3.5 mb-4 shadow-sm">
                            <Image source={{ uri: article.imageUrl }} className="w-16 h-16 rounded-xl mr-4 bg-[#F6F6F6]" resizeMode="cover" />
                            <View className="flex-1 justify-center">
                                <View className="flex-row items-center mb-1.5">
                                    <Text numberOfLines={2} className="text-[17px] font-semibold text-[#232c38] flex-1 mr-2">{article.title}</Text>
                                </View>
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
                    </TouchableOpacity>

                ))}
            </View>
        </View>
    );
};

export default RecentSaves; 