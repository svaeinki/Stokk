import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { TextInput, Divider, TextInputProps } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Articulo } from '../../database/DatabaseManager';
import { generarNumeroBodega } from '../../utils/Validation';

interface DataSectionProps {
  formData: Partial<Articulo>;
  onFieldChange: (field: keyof Articulo, value: string | number) => void;
  isEditing?: boolean;
}

const DataSection: React.FC<DataSectionProps> = ({
  formData,
  onFieldChange,
  isEditing = false,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const renderField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    props: Partial<TextInputProps> = {}
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, { backgroundColor: theme.colors.surface }]}
        mode="outlined"
        outlineColor={theme.colors.outline}
        activeOutlineColor={theme.colors.primary}
        textColor={theme.colors.onSurface}
        {...props}
      />
    </View>
  );

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        {t('product.section_data')}
      </Text>

      {renderField(
        t('product.name_label'),
        formData.nombre || '',
        (text) => onFieldChange('nombre', text),
        { placeholder: t('product.placeholder_name') }
      )}

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          {renderField(
            t('product.price_label'),
            formData.precio?.toString() || '',
            (text) => onFieldChange('precio', parseInt(text) || 0),
            {
              placeholder: '0',
              keyboardType: 'numeric',
              left: <TextInput.Affix text="$" />
            }
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          {renderField(
            t('product.quantity_label'),
            formData.cantidad?.toString() || '',
            (text) => onFieldChange('cantidad', parseInt(text) || 0),
            {
              placeholder: '1',
              keyboardType: 'numeric'
            }
          )}
        </View>
      </View>

      {renderField(
        t('product.description_label'),
        formData.descripcion || '',
        (text) => onFieldChange('descripcion', text),
        {
          placeholder: t('product.placeholder_desc'),
          multiline: true,
          numberOfLines: 3,
          style: [styles.textArea, { backgroundColor: theme.colors.surface }]
        }
      )}

      {renderField(
        t('product.location_label'),
        formData.numeroBodega || '',
        (text) => onFieldChange('numeroBodega', text),
        {
          placeholder: 'B123456789',
          disabled: isEditing,
          right: (
            <TextInput.Icon
              icon="refresh"
              onPress={() => onFieldChange('numeroBodega', generarNumeroBodega())}
            />
          )
        }
      )}
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
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    // Background handled by theme
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default DataSection;