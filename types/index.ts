// Portal UNK - Types and Interfaces

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'producer';
  email: string;
  createdAt: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  avatar?: string;
}

export interface DJ {
  id: string;
  name: string;
  artistName: string;
  phone: string;
  email: string;
  genres: string[];
  basePrice: string;
  soundcloudUrl?: string;
  youtubeUrl?: string;
  instagramUrl?: string;
  avatar?: string;
  status: 'available' | 'busy' | 'unavailable';
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Producer {
  id: string;
  userId: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  address: string;
  cnpj: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  eventDate: string;
  location: string;
  city: string;
  status: 'planned' | 'confirmed' | 'completed' | 'cancelled';
  createdBy: string;
  producerId?: string;
  totalAmount?: string;
  createdAt: string;
  updatedAt: string;
  producer?: Producer;
  djs?: EventDJ[];
}

export interface EventDJ {
  id: string;
  eventId: string;
  djId: string;
  fee: string;
  status: 'confirmed' | 'pending';
  createdAt: string;
  dj?: DJ;
  event?: Event;
}

export interface Contract {
  id: string;
  eventId: string;
  producerId: string;
  djId: string;
  contractType: 'standard' | 'premium' | 'exclusive';
  content: string;
  status: 'pending' | 'signed' | 'rejected';
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
  event?: Event;
  producer?: Producer;
  dj?: DJ;
}

export interface Payment {
  id: string;
  eventId: string;
  djId: string;
  producerId: string;
  amount: string;
  status: 'pending' | 'sent' | 'paid' | 'overdue';
  dueDate?: string;
  paidAt?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
  event?: Event;
  dj?: DJ;
  producer?: Producer;
}

export interface MediaFile {
  id: string;
  djId: string;
  originalName: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  category: 'presskit' | 'logo' | 'backdrop' | 'performance' | 'other';
  uploadedAt: string;
  dj?: DJ;
}

export interface ShareToken {
  id: string;
  producerId: string;
  djId: string;
  token: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  producer?: Producer;
  dj?: DJ;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  cep: string;
  phone: string;
  email: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

// Form types
export interface LoginForm {
  username: string;
  password: string;
}

export interface DJForm {
  name: string;
  artistName: string;
  phone: string;
  email: string;
  genres: string[];
  basePrice: string;
  soundcloudUrl?: string;
  youtubeUrl?: string;
  instagramUrl?: string;
  bio?: string;
  status: 'available' | 'busy' | 'unavailable';
}

export interface ProducerForm {
  companyName: string;
  contactPerson: string;
  phone: string;
  address: string;
  cnpj: string;
  isActive: boolean;
}

export interface EventForm {
  title: string;
  description?: string;
  eventDate: string;
  location: string;
  city: string;
  producerId: string;
  djIds: string[];
  fees: Record<string, string>;
}

// Dashboard stats
export interface DashboardStats {
  totalDJs: number;
  activeDJs: number;
  totalProducers: number;
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  pendingPayments: number;
  totalPendingAmount: number;
  thisMonthRevenue: number;
}

// Activity feed
export interface ActivityItem {
  id: string;
  type: 'payment' | 'contract' | 'dj' | 'event' | 'producer';
  title: string;
  description?: string;
  when: string;
  status?: 'pending' | 'confirmed' | 'active' | 'completed';
  userId?: string;
  entityId?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// File upload types
export interface UploadResponse {
  url: string;
  path: string;
  originalName: string;
  size: number;
  mimeType: string;
}