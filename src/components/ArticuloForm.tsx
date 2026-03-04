import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, ScrollView, Alert, Linking, Platform } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useSnackbar } from '../context/SnackbarContext';
import { TabParamList } from '../types/navigation';
import Logger from '../utils/Logger';
import ImageSection from './form/ImageSection';
import DataSection from './form/DataSection';
import NotesSection from './form/NotesSection';
import ActionButtons from './form/ActionButtons';
import { useArticuloForm } from '../hooks/useArticuloForm';

type IngresarRouteProp = RouteProp<TabParamList, 'Ingresar'>;

const ArticuloForm: React.FC = () => {
  const route = useRoute<IngresarRouteProp>();
  const articulo = route.params?.articulo;
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { showSuccess, showError } = useSnackbar();

  const [imagePickerLoading, setImagePickerLoading] = useState(false);

  const { formData, loading, handleFieldChange, handleSave, handleCancel } =
    useArticuloForm({
      initialArticulo: articulo,
      isEditing: !!articulo,
      onSuccess: showSuccess,
      onError: showError,
    });

  const openSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }, []);

  const showPermissionDeniedAlert = useCallback(
    (tipo: 'camera' | 'gallery') => {
      Alert.alert(
        t('permissions.required_title'),
        t('permissions.required_msg', { type: t(`permissions.${tipo}`) }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('permissions.open_settings'), onPress: openSettings },
        ]
      );
    },
    [t, openSettings]
  );

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      showPermissionDeniedAlert('camera');
      return;
    }

    try {
      setImagePickerLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        handleFieldChange('imagen', result.assets[0].uri);
      }
    } catch (error) {
      Logger.error('Error taking photo', error);
      showError(t('product.camera_error'));
    } finally {
      setImagePickerLoading(false);
    }
  }, [handleFieldChange, t, showError, showPermissionDeniedAlert]);

  const pickFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      showPermissionDeniedAlert('gallery');
      return;
    }

    try {
      setImagePickerLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        handleFieldChange('imagen', result.assets[0].uri);
      }
    } catch (error) {
      Logger.error('Error picking from gallery', error);
      showError(t('product.gallery_error'));
    } finally {
      setImagePickerLoading(false);
    }
  }, [handleFieldChange, t, showError, showPermissionDeniedAlert]);

  const pickImage = useCallback(() => {
    Alert.alert(
      t('permissions.select_image_title'),
      t('permissions.select_image_msg'),
      [
        { text: t('permissions.take_photo'), onPress: takePhoto },
        { text: t('permissions.pick_gallery'), onPress: pickFromGallery },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  }, [t, takePhoto, pickFromGallery]);

  const handleClearImage = useCallback(() => {
    handleFieldChange('imagen', '');
  }, [handleFieldChange]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.title, { color: theme.colors.primary }]}>
            {articulo ? t('product.edit_title') : t('product.new_title')}
          </Text>

          <ImageSection
            imageUri={formData.imagen}
            onPickImage={pickImage}
            onClearImage={handleClearImage}
          />

          <Divider
            style={[
              styles.divider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />

          <DataSection
            formData={formData}
            onFieldChange={handleFieldChange}
          />

          <Divider
            style={[
              styles.divider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />

          <NotesSection formData={formData} onFieldChange={handleFieldChange} />
        </Card.Content>
      </Card>

      <ActionButtons
        onSave={handleSave}
        onCancel={handleCancel}
        loading={loading || imagePickerLoading}
        isEditing={!!articulo}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  divider: {
    marginVertical: 16,
    height: 1,
  },
});

export default ArticuloForm;
