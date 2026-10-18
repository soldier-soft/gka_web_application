// GKA Construction ERP API Client

const BASE_URL = '/api/v1';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('gka_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('gka_token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('gka_token');
  localStorage.removeItem('gka_user');
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If token invalid, clean up unless checking me
    if (!endpoint.includes('/auth/me')) {
      removeAuthToken();
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => request<{ success: boolean; user: any }>('/auth/me'),

  // CRM & Enquiries
  createEnquiry: (data: any) =>
    request<{ success: boolean; message: string; leadId: string }>('/crm/enquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getLeads: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; count: number; leads: any[] }>(`/crm/leads${q}`);
  },
  updateLeadStatus: (id: string, data: any) =>
    request<{ success: boolean; lead: any }>(`/crm/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  convertLeadToProject: (id: string) =>
    request<{ success: boolean; message: string; client: any; project: any }>(`/crm/leads/${id}/convert`, {
      method: 'POST',
    }),

  // Projects
  getProjects: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; count: number; projects: any[] }>(`/projects${q}`);
  },
  getProjectById: (id: string) =>
    request<{ success: boolean; project: any; milestones: any[]; recentSiteReports: any[] }>(`/projects/${id}`),
  createProject: (data: any) =>
    request<{ success: boolean; project: any }>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProject: (id: string, data: any) =>
    request<{ success: boolean; project: any }>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  updateMilestone: (id: string, data: any) =>
    request<{ success: boolean; milestone: any }>(`/projects/milestones/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getDashboardStats: () =>
    request<{ success: boolean; stats: any; recentSiteReports: any[]; recentExpenses: any[] }>('/projects/stats/dashboard'),

  // Quotations & Estimator
  getRateLibrary: () =>
    request<{ success: boolean; rates: any[] }>('/quotations/rates/library'),
  getQuotations: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; count: number; quotations: any[] }>(`/quotations${q}`);
  },
  getQuotationById: (id: string) =>
    request<{ success: boolean; quotation: any }>(`/quotations/${id}`),
  createQuotation: (data: any) =>
    request<{ success: boolean; quotation: any }>('/quotations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  approveQuotation: (id: string) =>
    request<{ success: boolean; message: string; quotation: any }>(`/quotations/${id}/approve`, {
      method: 'POST',
    }),

  // Site Operations
  getSiteReports: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; count: number; reports: any[] }>(`/site-ops/reports${q}`);
  },
  createSiteReport: (data: any) =>
    request<{ success: boolean; report: any }>('/site-ops/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  togglePublishReport: (id: string) =>
    request<{ success: boolean; message: string; report: any }>(`/site-ops/reports/${id}/publish`, {
      method: 'PATCH',
    }),

  // Inventory
  getSuppliers: () =>
    request<{ success: boolean; count: number; suppliers: any[] }>('/inventory/suppliers'),
  createSupplier: (data: any) =>
    request<{ success: boolean; supplier: any }>('/inventory/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getPurchaseOrders: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; count: number; purchaseOrders: any[] }>(`/inventory/purchase-orders${q}`);
  },
  createPurchaseOrder: (data: any) =>
    request<{ success: boolean; purchaseOrder: any }>('/inventory/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getInventoryTransactions: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; count: number; transactions: any[] }>(`/inventory/transactions${q}`);
  },
  createInventoryTransaction: (data: any) =>
    request<{ success: boolean; transaction: any }>('/inventory/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getStockSummary: () =>
    request<{ success: boolean; count: number; stock: any[] }>('/inventory/stock-summary'),

  // Finance
  getInvoices: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; count: number; invoices: any[] }>(`/finance/invoices${q}`);
  },
  createInvoice: (data: any) =>
    request<{ success: boolean; invoice: any }>('/finance/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getExpenses: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; count: number; expenses: any[] }>(`/finance/expenses${q}`);
  },
  createExpense: (data: any) =>
    request<{ success: boolean; expense: any }>('/finance/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getPayments: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; count: number; payments: any[] }>(`/finance/payments${q}`);
  },
  recordPayment: (data: any) =>
    request<{ success: boolean; payment: any }>('/finance/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getProfitability: (projectId: string) =>
    request<{ success: boolean; project: any; categoryExpenses: any[] }>(`/finance/profitability/${projectId}`),

  // Client Portal
  getClientProjects: () =>
    request<{ success: boolean; count: number; projects: any[] }>('/client-portal/my-projects'),
  getClientProjectDetails: (id: string) =>
    request<{
      success: boolean;
      project: any;
      milestones: any[];
      publishedReports: any[];
      invoices: any[];
      quotations: any[];
      documents: any[];
    }>(`/client-portal/projects/${id}`),
};
