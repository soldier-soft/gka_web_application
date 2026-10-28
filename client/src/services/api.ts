// GKA Construction ERP API Client

const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api/v1';

  // If running in browser and envUrl is absolute, check if it points to current domain
  if (typeof window !== 'undefined' && envUrl.startsWith('http')) {
    try {
      const parsed = new URL(envUrl);
      const currentHost = window.location.hostname.replace(/^www\./, '');
      const apiHost = parsed.hostname.replace(/^www\./, '');
      // If same domain (with or without www), prefer relative path to avoid cross-origin preflights
      if (currentHost === apiHost) {
        return parsed.pathname || '/api/v1';
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  // If localhost was hardcoded but we are in production, fallback to /api/v1
  if (envUrl.includes('localhost') && typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return '/api/v1';
  }

  return envUrl;
};

const BASE_URL = getBaseUrl();


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

export const getFileUrl = (path: string): string => {
  const token = getAuthToken();
  if (!token) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}token=${encodeURIComponent(token)}`;
};

export const downloadFile = async (
  endpoint: string,
  filename: string,
  openInNewTab = false
): Promise<void> => {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') || endpoint.startsWith('/api') ? endpoint : `${BASE_URL}${endpoint}`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Download failed' }));
    throw new Error(errorData.message || 'Download failed');
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  if (openInNewTab) {
    const newWindow = window.open(blobUrl, '_blank');
    if (!newWindow) {
      // If popup blocked, fallback to normal link click
      const a = document.createElement('a');
      a.href = blobUrl;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  } else {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
};

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => request<{ success: boolean; user: any }>('/auth/me'),
  getProfile: () => request<{ success: boolean; user: any }>('/auth/profile'),
  updateProfile: (data: any) =>
    request<{ success: boolean; message: string; user: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAllUsers: () => request<{ success: boolean; users: any[] }>('/auth/users'),
  adminResetPassword: (data: { userId: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/auth/admin/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // CRM & Enquiries
  createEnquiry: (data: any) =>
    request<{ success: boolean; message: string; leadId: string }>('/crm/enquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  submitEnquiry: (data: any) =>
    request<{
      success: boolean;
      message: string;
      referenceNumber: string;
      enquiryId: string;
      emailNotificationSent: boolean;
    }>('/enquiries', {
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

  // Public Portfolio & Project Ideas
  getPublicProjects: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; count: number; total: number; projects: any[] }>(`/portfolio/projects${q}`);
  },
  getPublicProjectBySlug: (slug: string) =>
    request<{ success: boolean; project: any; relatedProjects: any[]; relatedIdeas: any[] }>(`/portfolio/projects/${slug}`),
  getProjectIdeas: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; count: number; total: number; ideas: any[] }>(`/project-ideas${q}`);
  },
  getProjectIdeaBySlug: (slug: string) =>
    request<{ success: boolean; idea: any; relatedIdeas: any[] }>(`/project-ideas/${slug}`),

  // Admin Portfolio & Idea Management
  adminCreateProject: (data: any) =>
    request<{ success: boolean; project: any }>('/portfolio/admin/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  adminUpdateProject: (id: string, data: any) =>
    request<{ success: boolean; project: any }>(`/portfolio/admin/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  adminDeleteProject: (id: string) =>
    request<{ success: boolean; message: string }>(`/portfolio/admin/projects/${id}`, {
      method: 'DELETE',
    }),
  adminCreateProjectIdea: (data: any) =>
    request<{ success: boolean; idea: any }>('/portfolio/admin/project-ideas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  adminUpdateProjectIdea: (id: string, data: any) =>
    request<{ success: boolean; idea: any }>(`/portfolio/admin/project-ideas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  adminDeleteProjectIdea: (id: string) =>
    request<{ success: boolean; message: string }>(`/portfolio/admin/project-ideas/${id}`, {
      method: 'DELETE',
    }),
  getEnquiries: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; count: number; total: number; enquiries: any[] }>(`/portfolio/admin/enquiries${q}`);
  },
  updateEnquiryStatus: (id: string, data: any) =>
    request<{ success: boolean; enquiry: any }>(`/portfolio/admin/enquiries/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Projects (Internal ERP)
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
  updateQuotation: (id: string, data: any) =>
    request<{ success: boolean; message: string; quotation: any }>(`/quotations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  approveQuotation: (id: string) =>
    request<{ success: boolean; message: string; quotation: any }>(`/quotations/${id}/approve`, {
      method: 'POST',
    }),
  convertQuotationToInvoice: (id: string, data?: any) =>
    request<{ success: boolean; message: string; invoice: any }>(`/quotations/${id}/convert-to-invoice`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
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
  updateInvoice: (id: string, data: any) =>
    request<{ success: boolean; message: string; invoice: any }>(`/finance/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  toggleInvoiceGst: (id: string, data: { gstFiled?: boolean; gstFilingArn?: string; gstTaxPeriod?: string }) =>
    request<{ success: boolean; message: string; invoice: any }>(`/finance/invoices/${id}/gst-toggle`, {
      method: 'PATCH',
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
  verifyPayment: (id: string) =>
    request<{ success: boolean; message: string; payment: any }>(`/finance/payments/${id}/verify`, {
      method: 'PATCH',
    }),
  reconcilePayment: (id: string) =>
    request<{ success: boolean; message: string; payment: any }>(`/finance/payments/${id}/reconcile`, {
      method: 'PATCH',
    }),
  rejectPayment: (id: string, reason?: string) =>
    request<{ success: boolean; message: string; payment: any }>(`/finance/payments/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),
  getProfitability: (projectId: string) =>
    request<{ success: boolean; project: any; categoryExpenses: any[] }>(`/finance/profitability/${projectId}`),

  // GST & Tax Reconciliation
  getTaxReconciliations: () =>
    request<{ success: boolean; count: number; records: any[] }>('/finance/gst/periods'),
  updateEligibleItc: (id: string, data: { eligibleItcPaise: number; taxAdjustmentsPaise?: number; reason?: string }) =>
    request<{ success: boolean; message: string; record: any }>(`/finance/gst/periods/${id}/eligible-itc`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  recordTaxPayment: (id: string, data: any) =>
    request<{ success: boolean; message: string; record: any }>(`/finance/gst/periods/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  recordTaxFiling: (id: string, data: any) =>
    request<{ success: boolean; message: string; record: any }>(`/finance/gst/periods/${id}/filing`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

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
      payments: any[];
      quotations: any[];
      documents: any[];
      feedbackTickets: any[];
      bankDetails: any;
    }>(`/client-portal/projects/${id}`),
  submitClientPayment: (data: any) =>
    request<{ success: boolean; message: string; payment: any }>('/client-portal/payments/submit-notification', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  submitClientFeedback: (data: any) =>
    request<{ success: boolean; message: string; feedback: any }>('/client-portal/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getClientFeedback: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; count: number; tickets: any[] }>(`/client-portal/feedback${q}`);
  },

  // Mail Service
  sendDocumentEmail: (data: {
    recipientEmail: string;
    recipientName?: string;
    documentType: 'welcome' | 'quotation' | 'invoice';
    documentNumber: string;
    projectTitle: string;
    siteLocation?: string;
    amount?: number;
    dueDate?: string;
    pdfUrl: string;
    portalUsername?: string;
    portalPassword?: string;
    customSubject?: string;
    customMessage?: string;
  }) =>
    request<{ success: boolean; message: string }>('/mail/send-document', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
