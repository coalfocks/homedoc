import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../utils/theme';

type LogoProps = {
  size?: number;
  color?: string;
};

export const Logo: React.FC<LogoProps> = ({
  size = 48,
  color = theme.colors.primary.main,
}) => {
  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        {/* House shape */}
        <Path d="M24 4L4 20H8V40H40V20H44L24 4Z" fill={color} />
        {/* Document shape */}
        <Path d="M32 24H16V28H32V24Z" fill="white" />
        <Path d="M32 30H16V34H32V30Z" fill="white" />
        <Path d="M32 36H16V40H32V36Z" fill="white" />
        {/* Decorative elements */}
        <Path
          d="M24 14C25.1046 14 26 15.1193 26 16.5C26 17.8807 25.1046 19 24 19C22.8954 19 22 17.8807 22 16.5C22 15.1193 22.8954 14 24 14Z"
          fill="white"
        />
        <Path
          d="M20 16H28"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
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
