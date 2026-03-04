import React, { memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { TextInput, TextInputProps } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Articulo } from '../../database/DatabaseManager';

// Componente memoizado para campos de texto - evita re-renders innecesarios
interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  inputProps?: Partial<TextInputProps>;
}

const FormField = memo<FormFieldProps>(
  ({ label, value, onChangeText, inputProps = {} }) => {
    const { theme } = useTheme();

    return (
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
          {...inputProps}
        />
      </View>
    );
  }
);

FormField.displayName = 'FormField';

interface DataSectionProps {
  formData: Partial<Articulo>;
  onFieldChange: (field: keyof Articulo, value: string | number) => void;
}

const DataSection: React.FC<DataSectionProps> = ({
  formData,
  onFieldChange,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        {t('product.section_data')}
      </Text>

      <FormField
        label={t('product.name_label')}
        value={formData.nombre || ''}
        onChangeText={text => onFieldChange('nombre', text)}
        inputProps={{ placeholder: t('product.placeholder_name') }}
      />

      <View style={styles.row}>
        <View style={styles.rowFieldLeft}>
          <FormField
            label={t('product.price_label')}
            value={formData.precio?.toString() || ''}
            onChangeText={text =>
              onFieldChange('precio', parseInt(text, 10) || 0)
            }
            inputProps={{
              placeholder: '0',
              keyboardType: 'numeric',
              left: <TextInput.Affix text="$" />,
            }}
          />
        </View>
        <View style={styles.rowFieldRight}>
          <FormField
            label={t('product.quantity_label')}
            value={formData.cantidad?.toString() || ''}
            onChangeText={text =>
              onFieldChange('cantidad', parseInt(text, 10) || 0)
            }
            inputProps={{
              placeholder: '1',
              keyboardType: 'numeric',
            }}
          />
        </View>
      </View>

      <FormField
        label={t('product.description_label')}
        value={formData.descripcion || ''}
        onChangeText={text => onFieldChange('descripcion', text)}
        inputProps={{
          placeholder: t('product.placeholder_desc'),
          multiline: true,
          numberOfLines: 3,
          style: styles.textArea,
        }}
      />

      <FormField
        label={t('product.location_label')}
        value={formData.numeroBodega || ''}
        onChangeText={text => onFieldChange('numeroBodega', text)}
        inputProps={{
          placeholder: t('product.placeholder_location'),
        }}
      />
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
  rowFieldLeft: {
    flex: 1,
    marginRight: 8,
  },
  rowFieldRight: {
    flex: 1,
    marginLeft: 8,
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
