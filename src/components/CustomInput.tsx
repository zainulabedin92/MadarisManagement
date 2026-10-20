import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';

interface CustomInputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: string;
  isPin?: boolean;
  required?: boolean;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  error,
  isPin = false,
  required = false,
  style,
  value,
  onChangeText,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPin, setShowPin] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.asterisk}> *</Text>}
      </View>

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isPin && !showPin}
          {...props}
        />

        {isPin && (
          <TouchableOpacity
            style={styles.togglePinBtn}
            onPress={() => setShowPin(!showPin)}
            activeOpacity={0.7}
          >
            <Text style={styles.togglePinText}>
              {showPin ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  asterisk: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  inputFocused: {
    borderColor: '#059669', // Emerald accent for Madaris theme
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 8,
  },
  togglePinBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  togglePinText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#EF4444',
  },
});
