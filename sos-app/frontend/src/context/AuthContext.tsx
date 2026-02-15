'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, getPermissions, Permissions } from '@/types';

interface AuthContextType {
  user: User | null;
  permissions: Permissions | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'sos_token';
const USER_KEY = 'sos_user';
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';

type BackendRole = 'DECLARANT' | 'PSY' | 'ADMIN_IT' | 'DIR_VILLAGE' | 'RESPONSABLE_SAUVEGARDE' | 'DIR_NATIONAL';
type BackendUser = {
  id: string;
  name: string;
  email: string;
  role: BackendRole;
  village?: { id: string; name: string } | null;
};

function mapRole(role: BackendRole): UserRole {
  if (role === 'DECLARANT') return 'normal';
  if (role === 'PSY') return 'psychologue';
  if (role === 'DIR_VILLAGE') return 'dir_village';
  if (role === 'RESPONSABLE_SAUVEGARDE') return 'responsable_save';
  if (role === 'DIR_NATIONAL') return 'dir_national';
  return 'admin_it';
}

function toFrontendUser(u: BackendUser): User {
  const parts = (u.name || '').trim().split(/\s+/);
  const firstName = parts[0] || u.email;
  const lastName = parts.slice(1).join(' ') || '';
  return {
    id: String(u.id),
    email: u.email,
    firstName,
    lastName,
    role: mapRole(u.role),
    village: u.village?.name || undefined,
    createdAt: new Date(),
  };
}

async function gqlRequest<T>(query: string, variables: Record<string, unknown> = {}, token?: string): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (!res.ok || body?.errors?.length) {
    throw new Error(body?.errors?.[0]?.message || 'AUTH_FAILED');
  }
  return body.data as T;
}

const LOGIN_MUTATION = `
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    user { id name email role village { id name } }
  }
}`;

const ME_QUERY = `
query Me {
  me { id name email role village { id name } }
}`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      const token = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }

      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser) as User;
          setUser(parsed);
          setPermissions(getPermissions(parsed.role));
        } catch {
          localStorage.removeItem(USER_KEY);
        }
      }

      try {
        const data = await gqlRequest<{ me: BackendUser }>(ME_QUERY, {}, token);
        if (data?.me) {
          const mapped = toFrontendUser(data.me);
          setUser(mapped);
          setPermissions(getPermissions(mapped.role));
          localStorage.setItem(USER_KEY, JSON.stringify(mapped));
        } else {
          throw new Error('NO_USER');
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setPermissions(null);
      } finally {
        setIsLoading(false);
      }
    }

    void bootstrap();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const data = await gqlRequest<{ login: { token: string; user: BackendUser } }>(
        LOGIN_MUTATION,
        { email, password }
      );
      const mapped = toFrontendUser(data.login.user);
      localStorage.setItem(TOKEN_KEY, data.login.token);
      localStorage.setItem(USER_KEY, JSON.stringify(mapped));
      setUser(mapped);
      setPermissions(getPermissions(mapped.role));
      setIsLoading(false);
      return true;
    } catch {
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setPermissions(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const switchRole = (_role: UserRole) => {};

  return (
    <AuthContext.Provider value={{ user, permissions, isLoading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
