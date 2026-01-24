import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface ActionButtonsProps {
  onSave: () => void;
  onCancel: () => void;
  loading?: boolean;
  isEditing?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onSave,
  onCancel,
  loading = false,
  isEditing = false,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.buttonContainer}>
      <Button
        mode="outlined"
        onPress={onCancel}
        style={[styles.cancelButton, { borderColor: theme.colors.outline }]}
        textColor={theme.colors.onSurface}
        disabled={loading}
      >
        {t('common.cancel')}
      </Button>

      <Button
        mode="contained"
        onPress={onSave}
        style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
        loading={loading}
        disabled={loading}
      >
        {isEditing ? t('common.update') : t('common.save')}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});

export default ActionButtons;