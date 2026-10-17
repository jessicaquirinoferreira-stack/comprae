import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, StoreSettings, Order } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS } from '../data/initialProducts';

interface StoreContextType {
  products: Product[];
  settings: StoreSettings;
  orders: Order[];
  isLoading: boolean;
  selectedCategory: string;
  searchQuery: string;
  selectedProduct: Product | null;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedProduct: (product: Product | null) => void;
  addProduct: (product: Omit<Product, 'id' | 'created_at'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  createOrder: (orderData: Omit<Order, 'id' | 'created_at' | 'status'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Initialize and sync Firestore products
  useEffect(() => {
    let unsubscribeProducts: (() => void) | undefined;
    let unsubscribeSettings: (() => void) | undefined;
    let unsubscribeOrders: (() => void) | undefined;

    const initFirestore = async () => {
      try {
        const productsRef = collection(db, 'products');
        const settingsDocRef = doc(db, 'settings', 'global');
        const ordersRef = collection(db, 'orders');

        // Check if products exist, seed if empty
        const initialSnap = await getDocs(productsRef);
        if (initialSnap.empty) {
          // Seed initial 12 products
          for (const item of INITIAL_PRODUCTS) {
            await setDoc(doc(db, 'products', item.id), item);
          }
          setProducts(INITIAL_PRODUCTS);
        } else {
          const loaded: Product[] = [];
          initialSnap.forEach((doc) => loaded.push(doc.data() as Product));
          setProducts(loaded);
        }

        // Listen for live product updates
        unsubscribeProducts = onSnapshot(
          productsRef,
          (snapshot) => {
            const list: Product[] = [];
            snapshot.forEach((d) => list.push(d.data() as Product));
            if (list.length > 0) {
              setProducts(list);
            }
          },
          (err) => {
            console.warn('Realtime products listener fallback:', err);
          }
        );

        // Listen for live settings updates
        unsubscribeSettings = onSnapshot(
          settingsDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setSettings(docSnap.data() as StoreSettings);
            } else {
              setDoc(settingsDocRef, INITIAL_SETTINGS).catch(console.error);
            }
          },
          (err) => {
            console.warn('Realtime settings listener fallback:', err);
          }
        );

        // Listen for live orders updates
        unsubscribeOrders = onSnapshot(
          ordersRef,
          (snapshot) => {
            const ords: Order[] = [];
            snapshot.forEach((d) => ords.push(d.data() as Order));
            ords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setOrders(ords);
          },
          (err) => {
            console.warn('Realtime orders listener fallback:', err);
          }
        );
      } catch (error) {
        console.warn('Firestore initial sync error, operating with local resilient state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initFirestore();

    return () => {
      if (unsubscribeProducts) unsubscribeProducts();
      if (unsubscribeSettings) unsubscribeSettings();
      if (unsubscribeOrders) unsubscribeOrders();
    };
  }, []);

  const addProduct = async (data: Omit<Product, 'id' | 'created_at'>): Promise<Product> => {
    const newId = `prod-${Date.now()}`;
    const newProd: Product = {
      ...data,
      id: newId,
      created_at: new Date().toISOString()
    };

    // Optimistic local update
    setProducts((prev) => [newProd, ...prev]);

    try {
      await setDoc(doc(db, 'products', newId), newProd);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `products/${newId}`);
    }

    return newProd;
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<void> => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p))
    );

    try {
      await updateDoc(doc(db, 'products', id), {
        ...updates,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
    }
  };

  const deleteProduct = async (id: string): Promise<void> => {
    setProducts((prev) => prev.filter((p) => p.id !== id));

    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  };

  const updateSettings = async (newSettings: Partial<StoreSettings>): Promise<void> => {
    const updated = {
      ...settings,
      ...newSettings,
      updated_at: new Date().toISOString()
    };
    setSettings(updated);

    try {
      await setDoc(doc(db, 'settings', 'global'), updated, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/global');
    }
  };

  const createOrder = async (
    orderData: Omit<Order, 'id' | 'created_at' | 'status'>
  ): Promise<Order> => {
    const orderId = `PED-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder: Order = {
      ...orderData,
      id: orderId,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    setOrders((prev) => [newOrder, ...prev]);

    try {
      await setDoc(doc(db, 'orders', orderId), newOrder);
    } catch (err) {
      console.warn('Could not persist order to Firestore, kept in local session:', err);
    }

    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );

    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (err) {
      console.warn('Order status sync error:', err);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        settings,
        orders,
        isLoading,
        selectedCategory,
        searchQuery,
        selectedProduct,
        setSelectedCategory,
        setSearchQuery,
        setSelectedProduct,
        addProduct,
        updateProduct,
        deleteProduct,
        updateSettings,
        createOrder,
        updateOrderStatus
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
