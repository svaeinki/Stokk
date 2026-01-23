import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import { Card, Button, Switch } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import DatabaseManager from '../database/DatabaseManager';
import { ConfigScreenNavigationProp } from '../types/navigation';
import { COLORS } from '../constants/app';
import Logger from '../utils/Logger';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n';

const ConfigScreen: React.FC = () => {
  const navigation = useNavigation<ConfigScreenNavigationProp>();
  const { isDark, toggleTheme, theme } = useTheme();
  const [isResetting, setIsResetting] = useState(false);
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    changeLanguage(lang);
  };

  const performReset = async () => {
    setIsResetting(true);
    try {
      await DatabaseManager.resetDatabase();
      Alert.alert(t('common.success'), t('config.delete_all_success'));
    } catch (error) {
      Logger.error('Error al resetear base de datos', error);
      Alert.alert(t('common.error'), t('config.delete_all_error'));
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
          onPress: () => {
            performReset();
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.title, { color: theme.colors.primary }]}>⚙️ {t('config.title')}</Text>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>💎 {t('config.subscription')}</Text>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchTitle, { color: theme.colors.onSurface }]}>{t('config.pro')}</Text>
                <Text style={[styles.switchDescription, { color: theme.colors.onSurfaceVariant }]}>{t('config.manage_subscription')}</Text>
              </View>
              <Button mode="contained" onPress={() => navigation.navigate('Paywall')} buttonColor={COLORS.gold} labelStyle={{ color: theme.colors.surface }}>
                {t('config.upgrade')}
              </Button>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>🌐 {t('config.language')}</Text>
            <View style={styles.switchContainer}>
              <View style={styles.languageRow}>
                <Button
                  mode={i18n.language.startsWith('es') ? 'contained' : 'outlined'}
                  onPress={() => handleLanguageChange('es')}
                  style={styles.langButton}
                >
                  {t('config.spanish')}
                </Button>
                <Button
                  mode={i18n.language.startsWith('en') ? 'contained' : 'outlined'}
                  onPress={() => handleLanguageChange('en')}
                  style={styles.langButton}
                >
                  {t('config.english')}
                </Button>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>🎨 {t('config.preferences')}</Text>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchTitle, { color: theme.colors.onSurface }]}>{t('config.theme')}</Text>
                <Text style={[styles.switchDescription, { color: theme.colors.onSurfaceVariant }]}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>ℹ️ {t('config.app_info')}</Text>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchTitle, { color: theme.colors.onSurface }]}>📱 {t('config.version')}</Text>
                <Text style={[styles.switchDescription, { color: theme.colors.onSurfaceVariant }]}>1.0.0</Text>
              </View>
            </View>
            <View style={styles.switchContainer}>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchTitle, { color: theme.colors.onSurface }]}>📧 {t('config.contact')}</Text>
                <Text style={[styles.switchDescription, { color: theme.colors.onSurfaceVariant }]}>support@stokk.app</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>💾 {t('config.data_management')}</Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleReset}
          style={styles.dangerButton}
          buttonColor={theme.colors.error}
          loading={isResetting}
          disabled={isResetting}
        >
          {isResetting ? t('common.loading') : t('config.delete_all')}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  switchContainer: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
  },
  langButton: {
    flex: 1,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
  },
  buttonContainer: {
    padding: 16,
  },
  dangerButton: {
    marginBottom: 16,
  },
});

export default ConfigScreen;