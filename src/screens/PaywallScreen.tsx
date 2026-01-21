import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Button, Card, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { PurchasesPackage } from 'react-native-purchases';
import SubscriptionService from '../services/SubscriptionService';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const PaywallScreen: React.FC = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        loadOfferings();
    }, []);

    const loadOfferings = async () => {
        try {
            // Intentar inicializar si no lo está
            await SubscriptionService.initialize();
            const offerings = await SubscriptionService.getOfferings();
            setPackages(offerings);
        } catch (error) {
            console.error('Error cargando ofertas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (pack: PurchasesPackage) => {
        setPurchasing(true);
        try {
            const success = await SubscriptionService.purchasePackage(pack);
            if (success) {
                Alert.alert('¡Gracias!', 'Has desbloqueado todas las funciones Pro.', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                // El usuario canceló o hubo un error manejado
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo completar la compra.');
        } finally {
            setPurchasing(false);
        }
    };

    const benefits = [
        { icon: 'inventory', text: 'Inventario Ilimitado (Más de 20 items)' },
        { icon: 'cloud-upload', text: 'Respaldo en la Nube (Próximamente)' },
        { icon: 'support-agent', text: 'Soporte Prioritario' },
        { icon: 'photo-camera', text: 'Fotos en Alta Calidad' },
    ];

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <MaterialIcons name="diamond" size={60} color="#FFD700" />
                <Text style={[styles.title, { color: theme.colors.onBackground }]}>Mejora a PRO</Text>
                <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                    Lleva tu negocio al siguiente nivel
                </Text>
            </View>

            <Card style={[styles.benefitsCard, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                    {benefits.map((benefit, index) => (
                        <View key={index} style={styles.benefitRow}>
                            <MaterialIcons name={benefit.icon as any} size={24} color={theme.colors.primary} />
                            <Text style={[styles.benefitText, { color: theme.colors.onSurface }]}>{benefit.text}</Text>
                        </View>
                    ))}
                </Card.Content>
            </Card>

            <View style={styles.packagesContainer}>
                {packages.length > 0 ? (
                    packages.map((pack) => (
                        <TouchableOpacity
                            key={pack.identifier}
                            onPress={() => handlePurchase(pack)}
                            style={styles.packageButton}
                            disabled={purchasing}
                        >
                            <View style={styles.packageInfo}>
                                <Text style={styles.packageTitle}>{pack.product.title}</Text>
                                <Text style={styles.packagePrice}>{pack.product.priceString}</Text>
                            </View>
                            <Text style={styles.packageDesc}>{pack.product.description}</Text>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={[styles.noOffers, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <Text style={[styles.noOffersText, { color: theme.colors.onSurfaceVariant }]}>
                            No hay ofertas disponibles en este momento.
                            {'\n'}
                            (Configura RevenueCat para ver precios)
                        </Text>
                        <Button
                            mode="contained"
                            onPress={() => navigation.goBack()}
                            style={{ marginTop: 20, backgroundColor: theme.colors.outline }}
                        >
                            Volver (Modo Demo)
                        </Button>
                    </View>
                )}
            </View>

            <Button
                mode="text"
                onPress={() => navigation.goBack()}
                color="#666"
                style={styles.closeButton}
            >
                Quizás más tarde
            </Button>
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
    content: {
        padding: 24,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    benefitsCard: {
        marginBottom: 32,
        elevation: 4,
        backgroundColor: '#fff',
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    benefitText: {
        fontSize: 16,
        marginLeft: 12,
        color: '#333',
    },
    packagesContainer: {
        gap: 16,
    },
    packageButton: {
        backgroundColor: '#D32F2F',
        padding: 16,
        borderRadius: 12,
        elevation: 2,
    },
    packageInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    packageTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    packagePrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    packageDesc: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
    },
    closeButton: {
        marginTop: 24,
    },
    noOffers: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    noOffersText: {
        textAlign: 'center',
        color: '#666',
        lineHeight: 22,
    },
});

export default PaywallScreen;
