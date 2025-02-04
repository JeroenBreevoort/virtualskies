declare module 'react-native-ios-kit' {
  import { ViewStyle } from 'react-native';
  
  interface SearchBarProps {
    placeholder?: string;
    value: string;
    onValueChange: (text: string) => void;
    style?: ViewStyle;
  }

  export const SearchBar: React.FC<SearchBarProps>;
} 