export type UserRole = 'admin' | 'petugas_loket' | 'dokter' | 'farmasi';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email?: string;
  phone?: string;
  nip?: string;
  loketId?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface StoredProcedureParam {
  name: string;
  type: string;
  value: any;
  direction?: 'IN' | 'OUT' | 'INOUT';
  description?: string;
}

export interface ProcedureDefinition {
  name: string;
  type: 'SELECT' | 'UPSERT' | 'ACTION';
  targetTable: string;
  description: string;
  parameters: StoredProcedureParam[];
  sqlDefinition: string;
}
