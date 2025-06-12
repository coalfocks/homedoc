import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../utils/theme';

type IconProps = {
  name: 'home' | 'area' | 'note' | 'add' | 'email' | 'lock' | 'google' | 'apple';
  size?: number;
  color?: string;
};

const iconPaths = {
  home: 'M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9ZM9 22V12H15V22',
  area: 'M3 3H21V21H3V3ZM3 9H21ZM9 3V21',
  note: 'M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2ZM14 2V8H20ZM16 13H8ZM16 17H8ZM10 9H9H8',
  add: 'M12 5V19M5 12H19',
  email: 'M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM19.6 8.25L12.53 12.67C12.21 12.87 11.79 12.87 11.47 12.67L4.4 8.25C4.15 8.09 4 7.82 4 7.53C4 6.86 4.73 6.46 5.3 6.81L12 11L18.7 6.81C19.27 6.46 20 6.86 20 7.53C20 7.82 19.85 8.09 19.6 8.25Z',
  lock: 'M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z',
  google: 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z',
  apple: 'M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35-4.21-4.08-3.47-11.3 2.95-11.5 1.33.07 2.25.74 3.05.79 1.24.05 1.97-.79 3.13-.79 1.15 0 1.84.79 3.05.76 1.26-.02 2.05.91 2.42 2.27-2.12 1.19-1.77 3.75-.01 4.77-.65 1.23-1.7 2.43-3.21 2.43zM14.95 7.05c.79-.95.65-2.23.5-3.05-.48.03-1.06.33-1.41.75-.35.42-.65 1.09-.5 1.75.53.03 1.06-.25 1.41-.45z',
};

export const Icon: React.FC<IconProps> = ({ name, size = 24, color = theme.colors.text.primary }) => {
  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d={iconPaths[name]}
          fill={name === 'google' || name === 'apple' ? color : 'none'}
          stroke={name === 'google' || name === 'apple' ? 'none' : color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 