import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import {
  Card,
  Button,
  Switch,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import RevenueCatUI from 'react-native-purchases-ui';
import { useTheme } from '../context/ThemeContext';
import { useSnackbar } from '../context/SnackbarContext';
import DatabaseManager from '../database/DatabaseManager';
import SubscriptionService, {
  SubscriptionStatus,
} from '../services/SubscriptionService';
import { ConfigScreenNavigationProp } from '../types/navigation';
import { COLORS } from '../constants/app';
import Logger from '../utils/Logger';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n';
import Constants from 'expo-constants';

const ConfigScreen: React.FC = () => {
  const navigation = useNavigation<ConfigScreenNavigationProp>();
  const { isDark, toggleTheme, theme } = useTheme();
  const { t, i18n } = useTranslation();
  const { showSuccess, showError, showInfo } = useSnackbar();

  const [isResetting, setIsResetting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Get app version from expo constants
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  // Load subscription status when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadSubscriptionStatus();
    }, [])
  );

  const loadSubscriptionStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const status = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      Logger.error('Error loading subscription status', error);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const handleLanguageChange = useCallback((lang: string) => {
    changeLanguage(lang);
  }, []);

  const handleUpgrade = useCallback(() => {
    navigation.navigate('Paywall');
  }, [navigation]);

  const handleManageSubscription = async () => {
    try {
      // Try to open RevenueCat Customer Center
      await RevenueCatUI.presentCustomerCenter();
    } catch (error) {
      Logger.warn(
        'Customer Center not available, opening store settings',
        error
      );
      // Fallback to platform-specific subscription management
      const url =
        Platform.OS === 'ios'
          ? 'https://apps.apple.com/account/subscriptions'
          : 'https://play.google.com/store/account/subscriptions';
      Linking.openURL(url);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const result = await SubscriptionService.restorePurchases();

      if (result.isPro) {
        showSuccess(t('paywall.restore_success_msg'));
        await loadSubscriptionStatus();
      } else {
        showInfo(t('paywall.no_purchases_msg'));
      }
    } catch (error) {
      Logger.error('Error restoring purchases', error);
      showError(t('config.restore_error'));
    } finally {
      setIsRestoring(false);
    }
  };

  const performReset = async () => {
    setIsResetting(true);
    try {
      await DatabaseManager.resetDatabase();
      showSuccess(t('config.delete_all_success'));
    } catch (error) {
      Logger.error('Error resetting database', error);
      showError(t('config.delete_all_error'));
    } finally {
      setIsResetting(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      t('config.delete_all_confirm_title'),
      t('config.delete_all_confirm_msg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('config.delete_all'),
          style: 'destructive',
          onPress: performReset,
        },
      ]
    );
  };

  const openPrivacyPolicy = useCallback(() => {
    Linking.openURL('https://stokk.app/privacy');
  }, []);

  const openTerms = useCallback(() => {
    Linking.openURL('https://stokk.app/terms');
  }, []);

  const openSupport = useCallback(() => {
    Linking.openURL('mailto:support@stokk.app');
  }, []);

  const formatExpirationDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(
        i18n.language === 'es' ? 'es-CL' : 'en-US',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }
      );
    } catch {
      return dateString;
    }
  };

  const getSubscriptionTypeLabel = (): string => {
    if (!subscriptionStatus?.isPro) return t('config.free');

    if (subscriptionStatus.isLifetime) {
      return t('config.lifetime');
    }

    const productId = subscriptionStatus.productIdentifier;
    if (productId?.includes('yearly') || productId?.includes('annual')) {
      return t('paywall.yearly');
    }
    if (productId?.includes('monthly')) {
      return t('paywall.monthly');
    }

    return t('config.pro');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Subscription Section */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="diamond" size={24} color={COLORS.gold} />
            <Text
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              {t('config.subscription')}
            </Text>
          </View>

          {loadingStatus ? (
            <ActivityIndicator
              size="small"
              color={theme.colors.primary}
              style={styles.loader}
            />
          ) : (
            <View style={styles.subscriptionInfo}>
              <View style={styles.statusRow}>
                <Text
                  style={[
                    styles.statusLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('config.status')}:
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: subscriptionStatus?.isPro
                        ? COLORS.gold
                        : theme.colors.surfaceVariant,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: subscriptionStatus?.isPro
                          ? '#000'
                          : theme.colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {getSubscriptionTypeLabel()}
                  </Text>
                </View>
              </View>

              {subscriptionStatus?.isPro && !subscriptionStatus.isLifetime && (
                <>
                  {subscriptionStatus.expirationDate && (
                    <View style={styles.statusRow}>
                      <Text
                        style={[
                          styles.statusLabel,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        {subscriptionStatus.willRenew
                          ? t('config.renews')
                          : t('config.expires')}
                        :
                      </Text>
                      <Text
                        style={[
                          styles.statusValue,
                          { color: theme.colors.onSurface },
                        ]}
                      >
                        {formatExpirationDate(
                          subscriptionStatus.expirationDate
                        )}
                      </Text>
                    </View>
                  )}
                </>
              )}

              <View style={styles.subscriptionButtons}>
                {subscriptionStatus?.isPro ? (
                  <Button
                    mode="outlined"
                    onPress={handleManageSubscription}
                    style={styles.subscriptionButton}
                    icon="cog"
                  >
                    {t('config.manage_subscription')}
                  </Button>
                ) : (
                  <Button
                    mode="contained"
                    onPress={handleUpgrade}
                    buttonColor={COLORS.gold}
                    textColor="#000"
                    style={styles.subscriptionButton}
                    icon="diamond"
                  >
                    {t('config.upgrade')}
                  </Button>
                )}

                <Button
                  mode="text"
                  onPress={handleRestore}
                  loading={isRestoring}
                  disabled={isRestoring}
                  style={styles.restoreButton}
                >
                  {t('config.restore')}
                </Button>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Language Section */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialIcons
              name="language"
              size={24}
              color={theme.colors.primary}
            />
            <Text
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              {t('config.language')}
            </Text>
          </View>

          <View style={styles.languageRow}>
            <Button
              mode={i18n.language.startsWith('es') ? 'contained' : 'outlined'}
              onPress={() => handleLanguageChange('es')}
              style={styles.langButton}
              compact
            >
              🇪🇸 {t('config.spanish')}
            </Button>
            <Button
              mode={i18n.language.startsWith('en') ? 'contained' : 'outlined'}
              onPress={() => handleLanguageChange('en')}
              style={styles.langButton}
              compact
            >
              🇺🇸 {t('config.english')}
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Preferences Section */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialIcons
              name="palette"
              size={24}
              color={theme.colors.primary}
            />
            <Text
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              {t('config.preferences')}
            </Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text
                style={[styles.settingTitle, { color: theme.colors.onSurface }]}
              >
                {t('config.theme')}
              </Text>
              <Text
                style={[
                  styles.settingDesc,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {isDark ? t('config.dark_mode') : t('config.light_mode')}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              color={theme.colors.primary}
            />
          </View>
        </Card.Content>
      </Card>

      {/* App Info Section */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialIcons
              name="info-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              {t('config.app_info')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text
              style={[
                styles.infoLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {t('config.version')}
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
              {appVersion}
            </Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.linksContainer}>
            <Button
              mode="text"
              onPress={openSupport}
              icon="email-outline"
              textColor={theme.colors.primary}
              style={styles.linkButton}
            >
              {t('config.contact')}
            </Button>

            <Button
              mode="text"
              onPress={openPrivacyPolicy}
              icon="shield-outline"
              textColor={theme.colors.primary}
              style={styles.linkButton}
            >
              {t('config.privacy')}
            </Button>

            <Button
              mode="text"
              onPress={openTerms}
              icon="file-document-outline"
              textColor={theme.colors.primary}
              style={styles.linkButton}
            >
              {t('config.terms')}
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Data Management Section */}
      <Card
        style={[
          styles.card,
          styles.dangerCard,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialIcons
              name="delete-forever"
              size={24}
              color={theme.colors.error}
            />
            <Text
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              {t('config.data_management')}
            </Text>
          </View>

          <Text
            style={[
              styles.warningText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {t('config.delete_warning')}
          </Text>

          <Button
            mode="contained"
            onPress={handleReset}
            buttonColor={theme.colors.error}
            style={styles.deleteButton}
            loading={isResetting}
            disabled={isResetting}
            icon="delete-alert"
          >
            {t('config.delete_all')}
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 0,
    elevation: 2,
  },
  dangerCard: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  loader: {
    marginVertical: 20,
  },
  subscriptionInfo: {
    marginTop: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  subscriptionButtons: {
    marginTop: 16,
  },
  subscriptionButton: {
    marginBottom: 8,
  },
  restoreButton: {
    marginTop: 4,
  },
  languageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  langButton: {
    flex: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDesc: {
    fontSize: 14,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 12,
  },
  linksContainer: {
    marginTop: 4,
  },
  linkButton: {
    alignSelf: 'flex-start',
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  deleteButton: {
    marginTop: 8,
  },
  bottomSpacer: {
    height: 32,
  },
});

export default ConfigScreen;
