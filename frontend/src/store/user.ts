import { create } from 'zustand';
import { UserDto } from '@/types/user';

interface UserState {
    user: UserDto | null;
    setUser: (user: UserDto | null) => void;
    wordBanks: { id: string; name: string }[];
    setWordBanks: (wordBanks: { id: string; name: string }[]) => void;
    currentWordBank: string | null;
    setCurrentWordBank: (wordBankId: string | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
    wordBanks: [],
    setWordBanks: (wordBanks) => set({ wordBanks }),
    currentWordBank: null,
    setCurrentWordBank: (wordBankId) => set({ currentWordBank: wordBankId }),
})); 