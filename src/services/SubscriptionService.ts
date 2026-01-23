import Purchases, { CustomerInfo, PurchasesPackage, PurchasesError } from 'react-native-purchases';
import { Platform } from 'react-native';
import Logger from '../utils/Logger';

// TODO: Reemplaza con tus llaves reales de RevenueCat
const API_KEYS = {
    apple: 'appl_YOUR_APPLE_KEY',
    google: 'goog_YOUR_GOOGLE_KEY',
};

// Tiempo de caché en milisegundos (5 minutos)
const CACHE_DURATION = 5 * 60 * 1000;

interface ProStatusCache {
    isPro: boolean;
    timestamp: number;
}

class SubscriptionService {
    private isInitialized = false;
    private proStatusCache: ProStatusCache | null = null;

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
            Logger.warn('Error inicializando RevenueCat (Probablemente falta API Key real)', error);
        }
    }

    async getCustomerInfo(): Promise<CustomerInfo | null> {
        try {
            return await Purchases.getCustomerInfo();
        } catch (error) {
            Logger.error('Error obteniendo info del cliente', error);
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
            Logger.error('Error obteniendo ofertas', error);
        }
        return [];
    }

    async purchasePackage(pack: PurchasesPackage): Promise<boolean> {
        try {
            const { customerInfo } = await Purchases.purchasePackage(pack);
            const isPro = this.checkProStatus(customerInfo);

            // Actualizar caché después de compra exitosa
            this.updateCache(isPro);

            return isPro;
        } catch (error) {
            const purchaseError = error as PurchasesError;
            if (!purchaseError.userCancelled) {
                Logger.error('Error en la compra', error);
            }
            return false;
        }
    }

    async isPro(forceRefresh = false): Promise<boolean> {
        if (!this.isInitialized) return false;

        // Verificar caché si no se fuerza actualización
        if (!forceRefresh && this.isCacheValid() && this.proStatusCache !== null) {
            return this.proStatusCache.isPro;
        }

        try {
            const customerInfo = await Purchases.getCustomerInfo();
            const isPro = this.checkProStatus(customerInfo);

            // Actualizar caché
            this.updateCache(isPro);

            return isPro;
        } catch (error) {
            // Si hay error pero tenemos caché, usar caché
            if (this.proStatusCache !== null) {
                return this.proStatusCache.isPro;
            }
            return false;
        }
    }

    // Invalidar caché (útil después de restaurar compras)
    invalidateCache(): void {
        this.proStatusCache = null;
    }

    // Restaurar compras
    async restorePurchases(): Promise<boolean> {
        try {
            const customerInfo = await Purchases.restorePurchases();
            const isPro = this.checkProStatus(customerInfo);
            this.updateCache(isPro);
            return isPro;
        } catch (error) {
            Logger.error('Error restaurando compras', error);
            return false;
        }
    }

    private checkProStatus(customerInfo: CustomerInfo): boolean {
        return customerInfo.entitlements.active['pro'] !== undefined;
    }

    private isCacheValid(): boolean {
        if (this.proStatusCache === null) return false;
        const now = Date.now();
        return (now - this.proStatusCache.timestamp) < CACHE_DURATION;
    }

    private updateCache(isPro: boolean): void {
        this.proStatusCache = {
            isPro,
            timestamp: Date.now(),
        };
    }
}

export default new SubscriptionService();
