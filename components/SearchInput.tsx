import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { svgIcons } from './CustomSvgIcons';
import theme from '~/constants/theme';
import Button from './Button';

interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, onSearch, placeholder = 'Search your stashes...' }) => {
  const [inputValue, setInputValue] = useState<string>(value || '');

  const handleInputChange = (text: string) => {
    setInputValue(text);
    if (onChange) onChange(text);
  };

  const handleButtonPress = () => {
    if (inputValue.length > 0) {
      setInputValue('');
      if (onChange) onChange('');
    } else {
      onSearch?.(inputValue);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.accent[300]}
        value={inputValue}
        onChangeText={handleInputChange}
        returnKeyType="search"
        underlineColorAndroid="transparent"
      />
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.8}
        onPress={handleButtonPress}
      >
        <SvgXml xml={inputValue.length > 0 ? svgIcons.add : svgIcons.search} width={15} height={15} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6f6f6',
    borderRadius: 18,
    paddingLeft: 16,
    paddingRight: 4,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: theme.colors.accent[400],
    height: '100%',
    backgroundColor: 'transparent',
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
});

export default SearchInput;
