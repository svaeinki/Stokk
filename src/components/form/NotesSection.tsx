import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { TextInput } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Articulo } from '../../database/DatabaseManager';

interface NotesSectionProps {
  formData: Partial<Articulo>;
  onFieldChange: (field: keyof Articulo, value: string) => void;
}

const NotesSection: React.FC<NotesSectionProps> = ({
  formData,
  onFieldChange,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        {t('product.section_notes')}
      </Text>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          {t('product.notes_label')}
        </Text>
        <TextInput
          value={formData.observaciones || ''}
          onChangeText={(text) => onFieldChange('observaciones', text)}
          style={[styles.input, { backgroundColor: theme.colors.surface }]}
          mode="outlined"
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          textColor={theme.colors.onSurface}
          placeholder={t('product.placeholder_notes')}
          multiline={true}
          numberOfLines={2}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  fieldContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    // Background handled by theme
  },
});

export default NotesSection;