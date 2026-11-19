import type {
  ApprovalStatus,
  BuyerRequirement,
  Enquiry,
  MatchResult,
  Order,
  OrderStatus,
  Product,
  PublicUser,
} from '../types';

const TOKEN_STORAGE_KEY = 'freshkart_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data as T;
}

export const api = {
  // Auth
  async register(payload: Record<string, unknown>): Promise<{ token: string; user: PublicUser }> {
    return apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async login(email: string, password: string): Promise<{ token: string; user: PublicUser }> {
    return apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  async me(): Promise<{ user: PublicUser }> {
    return apiFetch('/api/auth/me');
  },
  async updateProfile(payload: Record<string, unknown>): Promise<{ user: PublicUser }> {
    return apiFetch('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // Products
  async getProducts(params?: { mine?: boolean; includeAll?: boolean }): Promise<{ products: Product[] }> {
    const query = new URLSearchParams();
    if (params?.mine) query.set('mine', 'true');
    if (params?.includeAll) query.set('includeAll', 'true');
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return apiFetch(`/api/products${suffix}`);
  },
  async createProduct(payload: Record<string, unknown>): Promise<{ product: Product }> {
    return apiFetch('/api/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async updateProduct(id: string, payload: Record<string, unknown>): Promise<{ product: Product }> {
    return apiFetch(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  async deleteProduct(id: string): Promise<{ deleted: boolean; id: string }> {
    return apiFetch(`/api/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Buyer Requirements
  async getRequirements(mine?: boolean): Promise<{ requirements: BuyerRequirement[] }> {
    const suffix = mine ? '?mine=true' : '';
    return apiFetch(`/api/requirements${suffix}`);
  },
  async createRequirement(payload: Record<string, unknown>): Promise<{ requirement: BuyerRequirement }> {
    return apiFetch('/api/requirements', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async updateRequirementStatus(
    id: string,
    status: 'Open' | 'Fulfilled' | 'Closed'
  ): Promise<{ requirement: BuyerRequirement }> {
    return apiFetch(`/api/requirements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  async deleteRequirement(id: string): Promise<{ deleted: boolean; id: string }> {
    return apiFetch(`/api/requirements/${id}`, {
      method: 'DELETE',
    });
  },

  // Enquiries
  async getEnquiries(): Promise<{ enquiries: Enquiry[] }> {
    return apiFetch('/api/enquiries');
  },
  async createEnquiry(
    payload: Record<string, unknown>
  ): Promise<{ enquiry: Enquiry; order?: Order }> {
    return apiFetch('/api/enquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async updateEnquiryStatus(
    id: string,
    status: 'Accepted' | 'Rejected' | 'Pending'
  ): Promise<{ enquiry: Enquiry; order: Order | null }> {
    return apiFetch(`/api/enquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Orders
  async getOrders(): Promise<{ orders: Order[] }> {
    return apiFetch('/api/orders');
  },
  async updateOrder(
    id: string,
    payload: { status?: OrderStatus; agreedPrice?: number; notes?: string }
  ): Promise<{ order: Order }> {
    return apiFetch(`/api/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // Rule-Based Matching
  async getMatches(scope?: 'mine' | 'all'): Promise<{ matches: MatchResult[] }> {
    const suffix = scope === 'mine' ? '?scope=mine' : '';
    return apiFetch(`/api/matches${suffix}`);
  },

  // Admin
  async getAdminOverview(): Promise<{
    stats: {
      totalFarmers: number;
      totalBuyers: number;
      activeListings: number;
      pendingApprovals: number;
      totalEnquiries: number;
      confirmedOrders: number;
      openRequirements: number;
      demoOrderVolume: number;
    };
    farmers: PublicUser[];
    buyers: PublicUser[];
    products: Product[];
    requirements: BuyerRequirement[];
    enquiries: Enquiry[];
    orders: Order[];
  }> {
    return apiFetch('/api/admin/overview');
  },
  async updateProductApproval(
    id: string,
    approvalStatus: ApprovalStatus
  ): Promise<{ product: Product }> {
    return apiFetch(`/api/admin/products/${id}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({ approvalStatus }),
    });
  },
  async updateUserStatus(
    id: string,
    accountStatus: 'active' | 'suspended'
  ): Promise<{ user: PublicUser }> {
    return apiFetch(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ accountStatus }),
    });
  },
};
