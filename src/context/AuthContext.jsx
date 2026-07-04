/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { endpoints } from '../api/endpoints';
import { toFormData } from '../utils/format';

const STORAGE_KEY = 'community.user';
const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [authChecked, setAuthChecked] = useState(false);

  const applyUser = useCallback((nextUser) => {
    setUser(nextUser);
    writeStoredUser(nextUser);
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      const data = await api.post(endpoints.auth.login, { email, password });
      const detail = await api.get(endpoints.users.detail(data.userId)).catch(() => null);
      const nextUser = {
        id: data.userId,
        email: data.userEmail || email,
        nickname: data.nickname,
        imageUrl: data.imageUrl,
        role: detail?.role,
      };
      applyUser(nextUser);
      return nextUser;
    },
    [applyUser],
  );

  const logout = useCallback(async () => {
    try {
      await api.post(endpoints.auth.logout);
    } finally {
      applyUser(null);
    }
  }, [applyUser]);

  const register = useCallback(async ({ profileImage, ...values }) => {
    const formData = toFormData(values, { profileImage: profileImage ? [profileImage] : [] });
    return api.post(endpoints.users.register, formData);
  }, []);

  const updateProfile = useCallback(
    async ({ nickname, profileImage }) => {
      if (!user?.id) return null;

      const formData = toFormData({ nickname }, { profileImage: profileImage ? [profileImage] : [] });
      const data = await api.patch(endpoints.users.update(user.id), formData);
      const nextUser = {
        id: data.id,
        email: data.email,
        nickname: data.nickname,
        imageUrl: data.imageUrl,
        role: data.role || user.role,
      };
      applyUser(nextUser);
      return nextUser;
    },
    [applyUser, user?.id, user?.role],
  );

  const refreshSession = useCallback(async () => {
    if (!user) {
      setAuthChecked(true);
      return false;
    }

    try {
      await api.get(endpoints.auth.refresh);
      if (!user.role) {
        const detail = await api.get(endpoints.users.detail(user.id)).catch(() => null);
        if (!detail) {
          setAuthChecked(true);
          return true;
        }
        applyUser({
          id: detail.id,
          email: detail.email,
          nickname: detail.nickname,
          imageUrl: detail.imageUrl,
          role: detail.role,
        });
      }
      setAuthChecked(true);
      return true;
    } catch {
      applyUser(null);
      setAuthChecked(true);
      return false;
    }
  }, [applyUser, user]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: Boolean(user),
      authChecked,
      login,
      logout,
      register,
      updateProfile,
      setUser: applyUser,
      refreshSession,
    }),
    [applyUser, authChecked, login, logout, refreshSession, register, updateProfile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return value;
}
