import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  SafeAreaView,
  Alert,
} from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  CameraOptions,
  ImageLibraryOptions,
} from 'react-native-image-picker';

interface ImagePickerModalProps {
  imageUri: string | null;
  onImageSelected: (base64OrUri: string | null) => void;
  error?: string;
}

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  imageUri,
  onImageSelected,
  error,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleResponse = (response: ImagePickerResponse) => {
    if (response.didCancel) {
      return;
    }
    if (response.errorCode) {
      Alert.alert('Image Picker Error', response.errorMessage || 'Failed to pick image');
      return;
    }
    if (response.assets && response.assets.length > 0) {
      const asset = response.assets[0];
      // Format as base64 data URI if available, or fall back to uri
      if (asset.base64) {
        onImageSelected(`data:${asset.type || 'image/jpeg'};base64,${asset.base64}`);
      } else if (asset.uri) {
        onImageSelected(asset.uri);
      }
    }
    setModalVisible(false);
  };

  const handleCamera = () => {
    const options: CameraOptions = {
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    };
    launchCamera(options, handleResponse);
  };

  const handleGallery = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    };
    launchImageLibrary(options, handleResponse);
  };

  const handleRemove = () => {
    onImageSelected(null);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Upload Student Picture <Text style={styles.asterisk}>*</Text>
      </Text>

      <View style={styles.uploadArea}>
        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <View style={styles.previewActionRow}>
              <TouchableOpacity
                style={styles.changeBtn}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.changeBtnText}>📷 Change Picture</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => onImageSelected(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.removeBtnText}>✕ Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.uploadBox, !!error && styles.uploadBoxError]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.uploadIcon}>📷</Text>
            </View>
            <Text style={styles.uploadTitle}>Upload Picture</Text>
            <Text style={styles.uploadSubtext}>
              Tap to choose from Camera or Gallery
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Image Option</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalOption} onPress={handleCamera}>
              <Text style={styles.optionIcon}>📸</Text>
              <Text style={styles.optionLabel}>Take Photo with Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={handleGallery}>
              <Text style={styles.optionIcon}>🖼️</Text>
              <Text style={styles.optionLabel}>Choose from Gallery</Text>
            </TouchableOpacity>

            {imageUri && (
              <TouchableOpacity
                style={[styles.modalOption, styles.dangerOption]}
                onPress={handleRemove}
              >
                <Text style={styles.optionIcon}>🗑️</Text>
                <Text style={[styles.optionLabel, styles.dangerOptionLabel]}>
                  Remove Current Photo
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  asterisk: {
    color: '#EF4444',
    fontWeight: '700',
  },
  uploadArea: {
    alignItems: 'center',
  },
  uploadBox: {
    width: '100%',
    height: 130,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  uploadBoxError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  uploadIcon: {
    fontSize: 22,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  previewContainer: {
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imagePreview: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#059669',
    marginBottom: 12,
  },
  previewActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  changeBtn: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  changeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  removeBtn: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  removeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    color: '#6B7280',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  optionLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  dangerOption: {
    backgroundColor: '#FEF2F2',
  },
  dangerOptionLabel: {
    color: '#EF4444',
  },
});
