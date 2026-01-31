import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface ImageSectionProps {
  imageUri?: string;
  onPickImage: () => void;
  onClearImage: () => void;
}

const ImageSection: React.FC<ImageSectionProps> = ({
  imageUri,
  onPickImage,
  onClearImage,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.imageSection}>
      <TouchableOpacity
        onPress={onPickImage}
        style={[
          styles.imageContainer,
          {
            borderColor: theme.colors.outline,
            backgroundColor: theme.colors.surfaceVariant,
          },
        ]}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon
              name="add-a-photo"
              size={40}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.placeholderText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {t('product.add_photo')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      {imageUri && (
        <Button
          mode="text"
          onPress={onClearImage}
          textColor={theme.colors.error}
        >
          {t('product.delete_photo')}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  imageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    width: 200,
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
  },
});

export default ImageSection;
