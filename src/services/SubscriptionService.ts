import Purchases, {
    CustomerInfo,
    PurchasesOffering,
    PurchasesPackage,
    PurchasesError,
    LOG_LEVEL,
    PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import Logger from '../utils/Logger';

// RevenueCat API Keys from environment variables
const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '';

// Entitlement identifier configured in RevenueCat dashboard
const PRO_ENTITLEMENT_ID = 'Stokk Pro';

// Product identifiers
export const PRODUCT_IDS = {
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    LIFETIME: 'lifetime',
} as const;

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

interface ProStatusCache {
    isPro: boolean;
    timestamp: number;
    expirationDate?: string;
}

export interface SubscriptionStatus {
    isPro: boolean;
    expirationDate?: string;
    willRenew: boolean;
    productIdentifier?: string;
    isLifetime: boolean;
}

class SubscriptionService {
    private isInitialized = false;
    private proStatusCache: ProStatusCache | null = null;
    private customerInfoListener: ((info: CustomerInfo) => void) | null = null;
    private hasApiKey = () => !!API_KEY;

    /**
     * Initialize RevenueCat SDK
     * Should be called once at app startup
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            Logger.debug('RevenueCat already initialized');
            return;
        }

        try {
            if (!API_KEY) {
                Logger.warn('RevenueCat API key is not configured. Skipping initialization.');
                return;
            }

            // Enable debug logs in development
            if (__DEV__) {
                Purchases.setLogLevel(LOG_LEVEL.DEBUG);
            }

            // Configure RevenueCat
            Purchases.configure({ apiKey: API_KEY });

            // Set up customer info listener for real-time updates
            Purchases.addCustomerInfoUpdateListener((info) => {
                Logger.info('Customer info updated');
                this.handleCustomerInfoUpdate(info);
            });

            this.isInitialized = true;
            Logger.info('RevenueCat initialized successfully');

            // Pre-fetch customer info (non-blocking, silent failure)
            this.getCustomerInfo().catch(() => {
                // Silent failure - customer info will be fetched when needed
                Logger.debug('Could not pre-fetch customer info, will retry later');
            });
        } catch (error) {
            Logger.error('Error initializing RevenueCat', error);
            // Don't throw - allow app to continue without subscriptions
            this.isInitialized = false;
        }
    }

    /**
     * Handle customer info updates from RevenueCat
     */
    private handleCustomerInfoUpdate(customerInfo: CustomerInfo): void {
        const isPro = this.checkProEntitlement(customerInfo);
        this.updateCache(isPro, customerInfo);

        // Notify any listeners
        if (this.customerInfoListener) {
            this.customerInfoListener(customerInfo);
        }
    }

    /**
     * Set a listener for customer info updates
     */
    setCustomerInfoListener(listener: (info: CustomerInfo) => void): void {
        this.customerInfoListener = listener;
    }

    /**
     * Remove the customer info listener
     */
    removeCustomerInfoListener(): void {
        this.customerInfoListener = null;
    }

    /**
     * Get current customer info from RevenueCat
     */
    async getCustomerInfo(): Promise<CustomerInfo | null> {
        if (!this.hasApiKey()) {
            return null;
        }
        if (!this.isInitialized) {
            Logger.warn('RevenueCat not initialized, attempting initialization...');
            await this.initialize();
        }

        try {
            const customerInfo = await Purchases.getCustomerInfo();
            this.handleCustomerInfoUpdate(customerInfo);
            return customerInfo;
        } catch (error) {
            // Only log in debug mode to avoid console noise
            Logger.debug('Could not get customer info', error);
            return null;
        }
    }

    /**
     * Get available subscription offerings
     */
    async getOfferings(): Promise<PurchasesOffering | null> {
        if (!this.hasApiKey()) {
            return null;
        }
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const offerings = await Purchases.getOfferings();

            if (offerings.current) {
                Logger.info(`Found ${offerings.current.availablePackages.length} packages`);
                return offerings.current;
            }

            Logger.warn('No current offering found');
            return null;
        } catch (error) {
            Logger.error('Error getting offerings', error);
            return null;
        }
    }

    /**
     * Get all available packages from the current offering
     */
    async getPackages(): Promise<PurchasesPackage[]> {
        if (!this.hasApiKey()) {
            return [];
        }
        const offering = await this.getOfferings();
        return offering?.availablePackages ?? [];
    }

    /**
     * Purchase a specific package
     */
    async purchasePackage(pack: PurchasesPackage): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
        if (!this.hasApiKey()) {
            return { success: false, error: 'not_configured' };
        }
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const { customerInfo } = await Purchases.purchasePackage(pack);
            const isPro = this.checkProEntitlement(customerInfo);

            this.updateCache(isPro, customerInfo);
            Logger.info(`Purchase successful, isPro: ${isPro}`);

            return { success: isPro, customerInfo };
        } catch (error) {
            const purchaseError = error as PurchasesError;

            // User cancelled - not an error
            if (purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
                Logger.info('Purchase cancelled by user');
                return { success: false, error: 'cancelled' };
            }

            // Payment pending (e.g., waiting for parental approval)
            if (purchaseError.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
                Logger.info('Payment pending');
                return { success: false, error: 'pending' };
            }

            // Already purchased
            if (purchaseError.code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) {
                Logger.info('Product already purchased');
                // Restore and return success
                const restored = await this.restorePurchases();
                return { success: restored.isPro, error: 'already_purchased' };
            }

            Logger.error('Purchase error', purchaseError);
            return { success: false, error: purchaseError.message };
        }
    }

    /**
     * Check if user has Pro entitlement
     */
    async isPro(forceRefresh = false): Promise<boolean> {
        if (!this.hasApiKey()) {
            return false;
        }
        if (!this.isInitialized) {
            try {
                await this.initialize();
            } catch {
                return false;
            }
        }

        // Return cached value if valid and not forcing refresh
        if (!forceRefresh && this.isCacheValid()) {
            return this.proStatusCache!.isPro;
        }

        try {
            const customerInfo = await Purchases.getCustomerInfo();
            const isPro = this.checkProEntitlement(customerInfo);
            this.updateCache(isPro, customerInfo);
            return isPro;
        } catch (error) {
            Logger.error('Error checking pro status', error);
            // Return cached value if available, otherwise false
            return this.proStatusCache?.isPro ?? false;
        }
    }

    /**
     * Get detailed subscription status
     */
    async getSubscriptionStatus(): Promise<SubscriptionStatus> {
        if (!this.hasApiKey()) {
            return {
                isPro: false,
                willRenew: false,
                isLifetime: false,
            };
        }
        const customerInfo = await this.getCustomerInfo();

        if (!customerInfo) {
            return {
                isPro: false,
                willRenew: false,
                isLifetime: false,
            };
        }

        const entitlement = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];
        const isPro = !!entitlement;

        if (!isPro) {
            return {
                isPro: false,
                willRenew: false,
                isLifetime: false,
            };
        }

        return {
            isPro: true,
            expirationDate: entitlement.expirationDate ?? undefined,
            willRenew: entitlement.willRenew,
            productIdentifier: entitlement.productIdentifier,
            isLifetime: entitlement.expirationDate === null,
        };
    }

    /**
     * Restore previous purchases
     */
    async restorePurchases(): Promise<{ isPro: boolean; error?: string }> {
        if (!this.hasApiKey()) {
            return { isPro: false, error: 'not_configured' };
        }
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const customerInfo = await Purchases.restorePurchases();
            const isPro = this.checkProEntitlement(customerInfo);
            this.updateCache(isPro, customerInfo);

            Logger.info(`Restore completed, isPro: ${isPro}`);
            return { isPro };
        } catch (error) {
            const restoreError = error as PurchasesError;
            Logger.error('Error restoring purchases', restoreError);
            return { isPro: false, error: restoreError.message };
        }
    }

    /**
     * Invalidate the cache (useful after subscription changes)
     */
    invalidateCache(): void {
        this.proStatusCache = null;
        Logger.debug('Pro status cache invalidated');
    }

    /**
     * Log in a user with a custom app user ID
     * Use this when you have your own user authentication
     */
    async logIn(appUserID: string): Promise<CustomerInfo | null> {
        if (!this.hasApiKey()) {
            return null;
        }
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const { customerInfo } = await Purchases.logIn(appUserID);
            this.handleCustomerInfoUpdate(customerInfo);
            Logger.info(`Logged in as ${appUserID}`);
            return customerInfo;
        } catch (error) {
            Logger.error('Error logging in', error);
            return null;
        }
    }

    /**
     * Log out the current user
     */
    async logOut(): Promise<CustomerInfo | null> {
        if (!this.hasApiKey()) {
            return null;
        }
        if (!this.isInitialized) {
            return null;
        }

        try {
            const customerInfo = await Purchases.logOut();
            this.invalidateCache();
            Logger.info('Logged out');
            return customerInfo;
        } catch (error) {
            Logger.error('Error logging out', error);
            return null;
        }
    }

    /**
     * Get the current app user ID
     */
    async getAppUserID(): Promise<string | null> {
        if (!this.hasApiKey()) {
            return null;
        }
        if (!this.isInitialized) {
            return null;
        }

        try {
            return await Purchases.getAppUserID();
        } catch (error) {
            Logger.error('Error getting app user ID', error);
            return null;
        }
    }

    /**
     * Check if the user has the Pro entitlement
     */
    private checkProEntitlement(customerInfo: CustomerInfo): boolean {
        const hasEntitlement = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
        Logger.debug(`Pro entitlement check: ${hasEntitlement}`);
        return hasEntitlement;
    }

    /**
     * Check if the cache is still valid
     */
    private isCacheValid(): boolean {
        if (!this.proStatusCache) return false;
        const now = Date.now();
        return (now - this.proStatusCache.timestamp) < CACHE_DURATION;
    }

    /**
     * Update the cache with new subscription status
     */
    private updateCache(isPro: boolean, customerInfo: CustomerInfo): void {
        const entitlement = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];
        this.proStatusCache = {
            isPro,
            timestamp: Date.now(),
            expirationDate: entitlement?.expirationDate ?? undefined,
        };
    }
}

export default new SubscriptionService();
