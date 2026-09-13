import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ShippingAddress } from '@marketplace/types';

interface AddressState {
  addresses: ShippingAddress[];
  addAddress: (addr: Omit<ShippingAddress, 'id'>) => ShippingAddress;
  updateAddress: (id: string, addr: Partial<ShippingAddress>) => void;
  deleteAddress: (id: string) => void;
  setDefault: (id: string) => void;
  getDefaultAddress: () => ShippingAddress | undefined;
}

const DEFAULT_INITIAL_ADDRESS: ShippingAddress = {
  id: 'addr_1',
  recipientName: 'Nguyễn Văn An',
  phoneNumber: '0901234567',
  province: 'TP. Hồ Chí Minh',
  district: 'Quận 1',
  ward: 'Phường Bến Nghé',
  streetAddress: 'Số 12 Lê Duẩn',
  label: 'HOME',
  isDefault: true,
};

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [DEFAULT_INITIAL_ADDRESS],

      addAddress: (addrData) => {
        const newId = `addr_${Date.now()}`;
        const isFirstOrExplicit = get().addresses.length === 0 || addrData.isDefault;
        
        let currentList = get().addresses;
        if (isFirstOrExplicit) {
          currentList = currentList.map((a) => ({ ...a, isDefault: false }));
        }

        const newAddress: ShippingAddress = {
          ...addrData,
          id: newId,
          isDefault: isFirstOrExplicit,
        };

        set({ addresses: [newAddress, ...currentList] });
        return newAddress;
      },

      updateAddress: (id, updatedFields) => {
        set((state) => {
          let list = state.addresses.map((a) => (a.id === id ? { ...a, ...updatedFields } : a));
          if (updatedFields.isDefault) {
            list = list.map((a) => (a.id === id ? { ...a, isDefault: true } : { ...a, isDefault: false }));
          }
          return { addresses: list };
        });
      },

      deleteAddress: (id) => {
        set((state) => {
          const filtered = state.addresses.filter((a) => a.id !== id);
          // If deleted address was default, set first remaining as default
          if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
            filtered[0].isDefault = true;
          }
          return { addresses: filtered };
        });
      },

      setDefault: (id) => {
        set((state) => ({
          addresses: state.addresses.map((a) => ({
            ...a,
            isDefault: a.id === id,
          })),
        }));
      },

      getDefaultAddress: () => {
        const { addresses } = get();
        return addresses.find((a) => a.isDefault) || addresses[0];
      },
    }),
    {
      name: 'marketplace-user-addresses-storage',
    }
  )
);
