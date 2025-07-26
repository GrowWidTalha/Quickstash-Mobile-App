import React from 'react';
import { Button, TouchableOpacity } from 'react-native';
import { useStashDrawer } from '../contexts/StashDrawerContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const AddButton = () => {
    const { openDrawer } = useStashDrawer();
    return <TouchableOpacity onPress={openDrawer} className='bg-primary rounded-xl p-4 w-16 h-16 mb-4 items-center justify-center'>
        <FontAwesome name="plus-circle" size={28} color="#fff" />
    </TouchableOpacity>
};

export default AddButton;