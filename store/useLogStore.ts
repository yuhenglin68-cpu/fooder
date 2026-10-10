import { create } from 'zustand';
import { DailyLog, CreateDailyLogInput } from '@/database/types';
import {
  getDailyLogsByDate,
  getAllDailyLogs,
  insertDailyLog,
  deleteDailyLog,
} from '@/database';

export interface LogState {
  logs: DailyLog[];
  isLoading: boolean;

  loadLogsByDate: (dateString: string) => void;
  loadAllLogs: () => void;
  addLog: (input: CreateDailyLogInput) => DailyLog;
  removeLog: (id: string) => boolean;
}

export const useLogStore = create<LogState>((set, get) => ({
  logs: [],
  isLoading: false,

  loadLogsByDate: (dateString: string) => {
    set({ isLoading: true });
    try {
      const logs = getDailyLogsByDate(dateString);
      set({ logs, isLoading: false });
    } catch (e) {
      console.error('[useLogStore] Failed to load logs by date:', e);
      set({ isLoading: false });
    }
  },

  loadAllLogs: () => {
    set({ isLoading: true });
    try {
      const logs = getAllDailyLogs();
      set({ logs, isLoading: false });
    } catch (e) {
      console.error('[useLogStore] Failed to load all logs:', e);
      set({ isLoading: false });
    }
  },

  addLog: (input: CreateDailyLogInput) => {
    const log = insertDailyLog(input);
    // Reload whatever is currently needed? We can just append or reload all.
    // Easiest is to just re-fetch all for simplicity, or just prepend.
    set((state) => ({ logs: [log, ...state.logs] }));
    return log;
  },

  removeLog: (id: string) => {
    const success = deleteDailyLog(id);
    if (success) {
      set((state) => ({ logs: state.logs.filter((l) => l.id !== id) }));
    }
    return success;
  }
}));
