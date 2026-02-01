import { useCallback, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import DatabaseManager from '../database/DatabaseManager';
import SubscriptionService from '../services/SubscriptionService';
import Logger from '../utils/Logger';
import { FREE_TIER_PRODUCT_LIMIT } from '../constants/app';
import { IngresarScreenNavigationProp } from '../types/navigation';

interface UseSubscriptionLimitOptions {
  onError?: (message: string) => void;
}

export const useSubscriptionLimit = (options?: UseSubscriptionLimitOptions) => {
  const navigation = useNavigation<IngresarScreenNavigationProp>();
  const { t } = useTranslation();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const checkLimit = useCallback(async (): Promise<boolean> => {
    try {
      const [count, isPro] = await Promise.all([
        DatabaseManager.contarArticulos(),
        SubscriptionService.isPro(),
      ]);

      if (!isMountedRef.current) return false;

      if (count >= FREE_TIER_PRODUCT_LIMIT && !isPro) {
        Alert.alert(
          t('limit.title'),
          t('limit.message', { limit: FREE_TIER_PRODUCT_LIMIT }),
          [
            {
              text: t('common.cancel'),
              onPress: () => navigation.goBack(),
              style: 'cancel',
            },
            {
              text: t('limit.view_plans'),
              onPress: () => navigation.navigate('Paywall'),
            },
          ],
          { cancelable: false }
        );
        return false;
      }
      return true;
    } catch (error) {
      Logger.error('Error verificando límites', error);
      if (isMountedRef.current && options?.onError) {
        options.onError(t('list.error_loading'));
      }
      return false;
    }
  }, [t, navigation, options]);

  return { checkLimit };
};
