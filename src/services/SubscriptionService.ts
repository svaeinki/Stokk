import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';

// TODO: Reemplaza con tus llaves reales de RevenueCat
const API_KEYS = {
    apple: 'appl_YOUR_APPLE_KEY',
    google: 'goog_YOUR_GOOGLE_KEY',
};

class SubscriptionService {
    private isInitialized = false;

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            if (Platform.OS === 'ios') {
                Purchases.configure({ apiKey: API_KEYS.apple });
            } else if (Platform.OS === 'android') {
                Purchases.configure({ apiKey: API_KEYS.google });
            }
            this.isInitialized = true;
        } catch (error) {
            console.warn('⚠️ Error inicializando RevenueCat (Probablemente falta API Key real):', error);
        }
    }

    async getCustomerInfo(): Promise<CustomerInfo | null> {
        try {
            return await Purchases.getCustomerInfo();
        } catch (error) {
            console.error('Error obteniendo info del cliente:', error);
            return null;
        }
    }

    async getOfferings(): Promise<PurchasesPackage[]> {
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
                return offerings.current.availablePackages;
            }
        } catch (error) {
            console.error('Error obteniendo ofertas:', error);
        }
        return [];
    }

    async purchasePackage(pack: PurchasesPackage): Promise<boolean> {
        try {
            const { customerInfo } = await Purchases.purchasePackage(pack);
            return this.checkProStatus(customerInfo);
        } catch (error: any) {
            if (!error.userCancelled) {
                console.error('Error en la compra:', error);
            }
            return false;
        }
    }

    async isPro(): Promise<boolean> {
        if (!this.isInitialized) return false; // Por defecto es Free si falla la init

        try {
            const customerInfo = await Purchases.getCustomerInfo();
            return this.checkProStatus(customerInfo);
        } catch (error) {
            return false;
        }
    }

    // Verifica si el usuario tiene el 'entitlement' activo
    private checkProStatus(customerInfo: CustomerInfo): boolean {
        return customerInfo.entitlements.active['pro'] !== undefined;
    }
}

export default new SubscriptionService();
