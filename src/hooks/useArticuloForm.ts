import { useState, useEffect, useCallback } from 'react';
import { Articulo } from '../database/DatabaseManager';
import { useSubscriptionLimit } from './useSubscriptionLimit';
import { useArticuloSubmit } from './useArticuloSubmit';

interface UseArticuloFormProps {
  initialArticulo?: Articulo;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const createInitialFormData = (): Partial<Articulo> => ({
  nombre: '',
  descripcion: '',
  precio: 0,
  cantidad: 1,
  imagen: '',
  numeroBodega: '',
  observaciones: '',
  fechaIngreso: new Date().toISOString(),
});

export const useArticuloForm = ({
  initialArticulo,
  onSuccess,
  onError,
}: UseArticuloFormProps) => {
  const [formData, setFormData] = useState<Partial<Articulo>>(
    createInitialFormData
  );

  const { checkLimit } = useSubscriptionLimit({ onError });
  const {
    loading,
    errors,
    handleSave: submitForm,
    handleCancel,
  } = useArticuloSubmit({ initialArticulo, onSuccess, onError });

  useEffect(() => {
    if (initialArticulo) {
      setFormData(initialArticulo);
    } else {
      checkLimit();
    }
  }, [initialArticulo, checkLimit]);

  const handleFieldChange = useCallback(
    (field: keyof Articulo, value: string | number) => {
      setFormData((prev: Partial<Articulo>) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSave = useCallback(() => {
    return submitForm(formData);
  }, [submitForm, formData]);

  return {
    formData,
    loading,
    errors,
    handleFieldChange,
    handleSave,
    handleCancel,
  };
};
