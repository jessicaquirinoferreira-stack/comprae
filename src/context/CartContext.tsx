import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product, CartItem, ShippingAddress, ShippingOption } from '../types';
import { lookupCep, calculateCorreiosShipping } from '../lib/correios';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  total: number;
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  shippingAddress: ShippingAddress | null;
  shippingOption: ShippingOption | null;
  shippingOptions: ShippingOption[];
  isCalculatingShipping: boolean;
  shippingError: string | null;
  setIsCartOpen: (open: boolean) => void;
  setIsCheckoutOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setShippingAddress: (addr: ShippingAddress | null) => void;
  handleCepSearch: (cep: string) => Promise<boolean>;
  setShippingOption: (option: ShippingOption | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'comprae_cart_v1';
const ADDRESS_STORAGE_KEY = 'comprae_address_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(() => {
    try {
      const saved = localStorage.getItem(ADDRESS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [shippingOption, setShippingOption] = useState<ShippingOption | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [items]);

  // Sync address to localStorage
  useEffect(() => {
    try {
      if (shippingAddress) {
        localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(shippingAddress));
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [shippingAddress]);

  const subtotal = items.reduce((acc, curr) => acc + curr.product.price * curr.quantity, 0);
  const itemCount = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const total = subtotal + (shippingOption ? shippingOption.price : 0);

  // Recalculate shipping options whenever subtotal changes or address is present
  useEffect(() => {
    if (shippingAddress && shippingAddress.state) {
      const options = calculateCorreiosShipping(shippingAddress.state, subtotal);
      setShippingOptions(options);

      // Default to cheapest or previously selected
      if (!shippingOption || !options.some((o) => o.code === shippingOption.code)) {
        setShippingOption(options[0]);
      } else {
        const matching = options.find((o) => o.code === shippingOption.code);
        if (matching) setShippingOption(matching);
      }
    }
  }, [subtotal, shippingAddress?.state]);

  const handleCepSearch = async (cep: string): Promise<boolean> => {
    setIsCalculatingShipping(true);
    setShippingError(null);
    try {
      const data = await lookupCep(cep);
      if (!data) {
        setShippingError('CEP não encontrado. Por favor, verifique os 8 dígitos.');
        return false;
      }

      const newAddr: ShippingAddress = {
        cep: data.cep,
        street: data.logradouro || '',
        number: shippingAddress?.number || '',
        complement: data.complemento || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || ''
      };

      setShippingAddress(newAddr);

      const options = calculateCorreiosShipping(data.uf, subtotal);
      setShippingOptions(options);
      setShippingOption(options[0]);
      return true;
    } catch (err) {
      setShippingError('Erro ao consultar CEP dos Correios.');
      return false;
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setShippingOption(null);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        total,
        isCartOpen,
        isCheckoutOpen,
        shippingAddress,
        shippingOption,
        shippingOptions,
        isCalculatingShipping,
        shippingError,
        setIsCartOpen,
        setIsCheckoutOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        setShippingAddress,
        handleCepSearch,
        setShippingOption
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
