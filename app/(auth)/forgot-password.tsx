import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, StyleSheet } from 'react-native';
import Header from '~/components/header';

export default function ForgotPassword() {
  return (
    <SafeAreaView style={styles.container}>
      <Header title="Forgot Password" variant="master" />
      <Text>Forgot Password Screen</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    padding: 16,
  },
}); 