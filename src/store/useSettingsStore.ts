import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SettingsStore = {
  userName: string;
  setUserName: (name: string) => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      userName: "",
      setUserName: (name) => set({ userName: name }),
    }),
    {
      name: "hosizora-settings",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
