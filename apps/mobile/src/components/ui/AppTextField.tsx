import { StyleSheet, Text, TextInput, View } from 'react-native';

interface AppTextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  error?: string;
  multiline?: boolean;
}

export function AppTextField({ label, error, multiline, ...props }: AppTextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMultiline, error ? styles.inputError : null]}
        textAlignVertical={multiline ? 'top' : 'auto'}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dbe2ea',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  inputMultiline: {
    minHeight: 72
  },
  inputError: {
    borderColor: '#dc2626'
  },
  error: {
    color: '#dc2626',
    marginTop: 4,
    fontSize: 12
  }
});
