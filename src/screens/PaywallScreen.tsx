import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert, TouchableOpacity, Linking } from 'react-native';
import { Button, Card, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { PurchasesPackage } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import SubscriptionService from '../services/SubscriptionService';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import Logger from '../utils/Logger';
import { PaywallScreenNavigationProp } from '../types/navigation';
import { FREE_TIER_PRODUCT_LIMIT, COLORS } from '../constants/app';
import { useTranslation } from 'react-i18next';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface Benefit {
    icon: MaterialIconName;
    title: string;
    description: string;
}

const PaywallScreen: React.FC = () => {
    const navigation = useNavigation<PaywallScreenNavigationProp>();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();

    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
    const [useNativePaywall, setUseNativePaywall] = useState(false);

    useEffect(() => {
        initializePaywall();
    }, []);

    const initializePaywall = async () => {
        try {
            // First try to present native RevenueCat paywall
            if (useNativePaywall) {
                const result = await presentNativePaywall();
                if (result !== 'fallback') {
                    return;
                }
            }

            // Fallback to custom paywall
            await loadOfferings();
        } catch (error) {
            Logger.error('Error initializing paywall', error);
            await loadOfferings();
        }
    };

    const presentNativePaywall = async (): Promise<'purchased' | 'cancelled' | 'fallback'> => {
        try {
            const paywallResult = await RevenueCatUI.presentPaywall();

            switch (paywallResult) {
                case PAYWALL_RESULT.PURCHASED:
                case PAYWALL_RESULT.RESTORED:
                    Alert.alert(
                        t('paywall.purchase_success'),
                        t('paywall.purchase_success_msg'),
                        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
                    );
                    return 'purchased';

                case PAYWALL_RESULT.CANCELLED:
                    navigation.goBack();
                    return 'cancelled';

                case PAYWALL_RESULT.NOT_PRESENTED:
                default:
                    // Fall back to custom paywall
                    setUseNativePaywall(false);
                    return 'fallback';
            }
        } catch (error) {
            Logger.warn('Native paywall not available, using custom paywall', error);
            setUseNativePaywall(false);
            return 'fallback';
        }
    };

    const loadOfferings = async () => {
        try {
            setLoading(true);
            await SubscriptionService.initialize();
            const availablePackages = await SubscriptionService.getPackages();
            setPackages(availablePackages);

            // Auto-select yearly as best value
            const yearlyPkg = availablePackages.find(p =>
                p.packageType === 'ANNUAL' || p.identifier.includes('yearly')
            );
            if (yearlyPkg) {
                setSelectedPackage(yearlyPkg.identifier);
            } else if (availablePackages.length > 0) {
                setSelectedPackage(availablePackages[0].identifier);
            }
        } catch (error) {
            Logger.error('Error loading offerings', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = useCallback(async (pack: PurchasesPackage) => {
        setPurchasing(true);
        try {
            const result = await SubscriptionService.purchasePackage(pack);

            if (result.success) {
                Alert.alert(
                    t('paywall.purchase_success'),
                    t('paywall.purchase_success_msg'),
                    [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
                );
            } else if (result.error === 'cancelled') {
                // User cancelled, do nothing
            } else if (result.error === 'pending') {
                Alert.alert(
                    t('paywall.payment_pending_title'),
                    t('paywall.payment_pending_msg')
                );
            } else if (result.error === 'already_purchased') {
                Alert.alert(
                    t('paywall.already_purchased_title'),
                    t('paywall.already_purchased_msg'),
                    [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert(t('common.error'), result.error || t('paywall.purchase_error'));
            }
        } catch (error) {
            Logger.error('Purchase error', error);
            Alert.alert(t('common.error'), t('paywall.purchase_error'));
        } finally {
            setPurchasing(false);
        }
    }, [navigation, t]);

    const handleRestore = useCallback(async () => {
        setPurchasing(true);
        try {
            const result = await SubscriptionService.restorePurchases();

            if (result.isPro) {
                Alert.alert(
                    t('config.restore_success'),
                    t('paywall.restore_success_msg'),
                    [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert(
                    t('paywall.no_purchases_title'),
                    t('paywall.no_purchases_msg')
                );
            }
        } catch (error) {
            Logger.error('Restore error', error);
            Alert.alert(t('common.error'), t('config.restore_error'));
        } finally {
            setPurchasing(false);
        }
    }, [navigation, t]);

    const openPrivacyPolicy = useCallback(() => {
        Linking.openURL('https://stokk.app/privacy');
    }, []);

    const openTerms = useCallback(() => {
        Linking.openURL('https://stokk.app/terms');
    }, []);

    const benefits: Benefit[] = useMemo(() => [
        {
            icon: 'all-inclusive',
            title: t('paywall.feature_1_title'),
            description: t('paywall.feature_1_desc'),
        },
        {
            icon: 'block',
            title: t('paywall.feature_2_title'),
            description: t('paywall.feature_2_desc'),
        },
        {
            icon: 'support-agent',
            title: t('paywall.feature_3_title'),
            description: t('paywall.feature_3_desc'),
        },
        {
            icon: 'cloud-upload',
            title: t('paywall.feature_4_title'),
            description: t('paywall.feature_4_desc'),
        },
    ], [t]);

    const getPackageLabel = (pack: PurchasesPackage): string => {
        switch (pack.packageType) {
            case 'MONTHLY':
                return t('paywall.monthly');
            case 'ANNUAL':
                return t('paywall.yearly');
            case 'LIFETIME':
                return t('paywall.lifetime');
            default:
                return pack.product.title;
        }
    };

    const getPackageSavings = (pack: PurchasesPackage): string | null => {
        if (pack.packageType === 'ANNUAL') {
            return t('paywall.save_percent', { percent: '50%' });
        }
        if (pack.packageType === 'LIFETIME') {
            return t('paywall.best_value');
        }
        return null;
    };

    // Show loading while trying native paywall or loading packages
    if (loading && useNativePaywall) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
                    {t('paywall.loading_products')}
                </Text>
            </View>
        );
    }

    // Custom fallback paywall
    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: COLORS.gold + '20' }]}>
                    <MaterialIcons name="diamond" size={48} color={COLORS.gold} />
                </View>
                <Text style={[styles.title, { color: theme.colors.onBackground }]}>
                    {t('paywall.title')}
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                    {t('paywall.subtitle')}
                </Text>
            </View>

            {/* Benefits */}
            <Card style={[styles.benefitsCard, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                    {benefits.map((benefit, index) => (
                        <View key={index} style={styles.benefitRow}>
                            <View style={[styles.benefitIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                                <MaterialIcons name={benefit.icon} size={24} color={theme.colors.primary} />
                            </View>
                            <View style={styles.benefitText}>
                                <Text style={[styles.benefitTitle, { color: theme.colors.onSurface }]}>
                                    {benefit.title}
                                </Text>
                                <Text style={[styles.benefitDesc, { color: theme.colors.onSurfaceVariant }]}>
                                    {benefit.description}
                                </Text>
                            </View>
                        </View>
                    ))}
                </Card.Content>
            </Card>

            {/* Packages */}
            <View style={styles.packagesContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                ) : packages.length > 0 ? (
                    <>
                        {packages.map((pack) => {
                            const isSelected = selectedPackage === pack.identifier;
                            const savings = getPackageSavings(pack);

                            return (
                                <TouchableOpacity
                                    key={pack.identifier}
                                    onPress={() => setSelectedPackage(pack.identifier)}
                                    style={[
                                        styles.packageCard,
                                        {
                                            backgroundColor: isSelected ? theme.colors.primaryContainer : theme.colors.surface,
                                            borderColor: isSelected ? theme.colors.primary : theme.colors.outline,
                                            borderWidth: isSelected ? 2 : 1,
                                        },
                                    ]}
                                    disabled={purchasing}
                                >
                                    {savings && (
                                        <View style={[styles.savingsBadge, { backgroundColor: COLORS.gold }]}>
                                            <Text style={styles.savingsText}>{savings}</Text>
                                        </View>
                                    )}
                                    <View style={styles.packageContent}>
                                        <View style={styles.packageLeft}>
                                            <View style={[
                                                styles.radioOuter,
                                                { borderColor: isSelected ? theme.colors.primary : theme.colors.outline }
                                            ]}>
                                                {isSelected && (
                                                    <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />
                                                )}
                                            </View>
                                            <View style={styles.packageInfo}>
                                                <Text style={[styles.packageLabel, { color: theme.colors.onSurface }]}>
                                                    {getPackageLabel(pack)}
                                                </Text>
                                                <Text style={[styles.packageDesc, { color: theme.colors.onSurfaceVariant }]}>
                                                    {pack.product.description}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.packageRight}>
                                            <Text style={[styles.packagePrice, { color: theme.colors.primary }]}>
                                                {pack.product.priceString}
                                            </Text>
                                            {pack.packageType === 'ANNUAL' && (
                                                <Text style={[styles.pricePerMonth, { color: theme.colors.onSurfaceVariant }]}>
                                                    {t('paywall.per_month', { price: `$${(pack.product.price / 12).toFixed(2)}` })}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Purchase Button */}
                        <Button
                            mode="contained"
                            onPress={() => {
                                const pack = packages.find(p => p.identifier === selectedPackage);
                                if (pack) handlePurchase(pack);
                            }}
                            style={[styles.purchaseButton, { backgroundColor: theme.colors.primary }]}
                            labelStyle={styles.purchaseButtonLabel}
                            loading={purchasing}
                            disabled={purchasing || !selectedPackage}
                        >
                            {t('paywall.continue')}
                        </Button>
                    </>
                ) : (
                    <View style={[styles.noOffers, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <MaterialIcons name="info-outline" size={48} color={theme.colors.onSurfaceVariant} />
                        <Text style={[styles.noOffersText, { color: theme.colors.onSurfaceVariant }]}>
                            {t('paywall.no_offers')}
                        </Text>
                        <Text style={[styles.noOffersSubtext, { color: theme.colors.outline }]}>
                            {t('paywall.no_offers_subtitle')}
                        </Text>
                    </View>
                )}
            </View>

            {/* Restore & Links */}
            <View style={styles.footer}>
                <Button
                    mode="text"
                    onPress={handleRestore}
                    textColor={theme.colors.primary}
                    disabled={purchasing}
                >
                    {t('paywall.restore')}
                </Button>

                <View style={styles.legalLinks}>
                    <TouchableOpacity onPress={openTerms}>
                        <Text style={[styles.legalLink, { color: theme.colors.onSurfaceVariant }]}>
                            {t('paywall.terms')}
                        </Text>
                    </TouchableOpacity>
                    <Text style={[styles.legalSeparator, { color: theme.colors.outline }]}>•</Text>
                    <TouchableOpacity onPress={openPrivacyPolicy}>
                        <Text style={[styles.legalLink, { color: theme.colors.onSurfaceVariant }]}>
                            {t('paywall.privacy')}
                        </Text>
                    </TouchableOpacity>
                </View>

                <Button
                    mode="text"
                    onPress={() => navigation.goBack()}
                    textColor={theme.colors.onSurfaceVariant}
                    style={styles.closeButton}
                >
                    {t('paywall.maybe_later')}
                </Button>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    content: {
        padding: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
        marginTop: 8,
        textAlign: 'center',
    },
    benefitsCard: {
        marginBottom: 24,
        elevation: 2,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    benefitIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    benefitText: {
        flex: 1,
    },
    benefitTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    benefitDesc: {
        fontSize: 14,
        lineHeight: 20,
    },
    packagesContainer: {
        marginBottom: 16,
    },
    packageCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        position: 'relative',
        overflow: 'hidden',
    },
    savingsBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderBottomLeftRadius: 8,
    },
    savingsText: {
        color: '#000',
        fontSize: 12,
        fontWeight: 'bold',
    },
    packageContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    packageLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    packageInfo: {
        flex: 1,
    },
    packageLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    packageDesc: {
        fontSize: 13,
        marginTop: 2,
    },
    packageRight: {
        alignItems: 'flex-end',
    },
    packagePrice: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    pricePerMonth: {
        fontSize: 12,
        marginTop: 2,
    },
    purchaseButton: {
        marginTop: 8,
        paddingVertical: 6,
        borderRadius: 12,
    },
    purchaseButtonLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
    },
    legalLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    legalLink: {
        fontSize: 14,
    },
    legalSeparator: {
        marginHorizontal: 8,
    },
    closeButton: {
        marginTop: 16,
    },
    noOffers: {
        padding: 32,
        alignItems: 'center',
        borderRadius: 12,
    },
    noOffersText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
        textAlign: 'center',
    },
    noOffersSubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
});

export default PaywallScreen;
