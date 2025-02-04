import { View, StyleSheet } from 'react-native';
import { Text } from '../../components/Themed';
import Colors from '../../constants/Colors';

export default function ATCScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ATC Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
}); 