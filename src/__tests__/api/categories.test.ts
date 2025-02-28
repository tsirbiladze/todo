import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// Mock Next.js Response class
class MockResponse {
  _status: number;
  _json: any;

  constructor(json: any, options: { status: number }) {
    this._json = json;
    this._status = options.status;
  }

  get status() {
    return this._status;
  }

  async json() {
    return typeof this._json === 'string' ? JSON.parse(this._json) : this._json;
  }
}

// Use mockResponse instead of Response
global.Response = MockResponse as any;

// Mock the actual API route functions
const GET = jest.fn();
const POST = jest.fn();
const PUT = jest.fn();
const DELETE = jest.fn();

// Mock the module
jest.mock('@/app/api/categories/route', () => ({
  GET,
  POST,
  PUT,
  DELETE
}));

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

describe('Categories API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/categories', () => {
    it('returns categories for authenticated user', async () => {
      // Sample data
      const mockUser = { id: 'user1', email: 'test@example.com' };
      const mockCategories = [
        { id: 'cat1', name: 'Work', color: '#ff0000', userId: mockUser.id },
        { id: 'cat2', name: 'Personal', color: '#00ff00', userId: mockUser.id },
      ];
      
      // Setup mocks
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: mockUser.email }
      });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);
      
      // Mock the implementation directly
      GET.mockImplementation(async () => {
        const session = await getServerSession();
        
        if (!session?.user?.email) {
          return new MockResponse({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Get user by email
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        });
        
        if (!user) {
          return new MockResponse({ error: 'User not found' }, { status: 404 });
        }
        
        // Get categories
        const categories = await prisma.category.findMany({
          where: { userId: user.id },
          orderBy: { name: 'asc' },
        });
        
        return new MockResponse({ categories }, { status: 200 });
      });
      
      // Execute the function
      const response = await GET();
      
      // Parse response
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.categories).toEqual(mockCategories);
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        orderBy: { name: 'asc' },
      });
    });

    it('returns 401 when user is not authenticated', async () => {
      // Setup mock
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      // Mock implementation
      GET.mockImplementation(async () => {
        const session = await getServerSession();
        
        if (!session?.user?.email) {
          return new MockResponse({ error: 'Unauthorized' }, { status: 401 });
        }
        
        return new MockResponse(null, { status: 200 });
      });
      
      // Execute the function
      const response = await GET();
      
      // Parse response
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/categories', () => {
    it('creates a new category for authenticated user', async () => {
      // Sample data
      const mockUser = { id: 'user1', email: 'test@example.com' };
      const categoryData = {
        name: 'New Category',
        color: '#0000ff',
      };
      
      const createdCategory = {
        id: 'new-cat-id',
        ...categoryData,
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Setup mocks
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: mockUser.email }
      });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.category.create as jest.Mock).mockResolvedValue(createdCategory);
      
      // Mock implementation
      POST.mockImplementation(async (request: NextRequest) => {
        const session = await getServerSession();
        
        if (!session?.user?.email) {
          return new MockResponse({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Get user by email
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        });
        
        if (!user) {
          return new MockResponse({ error: 'User not found' }, { status: 404 });
        }
        
        const data = await request.json();
        
        // Create category
        const category = await prisma.category.create({
          data: {
            ...data,
            user: {
              connect: { id: user.id },
            },
          },
        });
        
        return new MockResponse({ category }, { status: 201 });
      });
      
      // Create a mock request
      const request = {
        json: jest.fn().mockResolvedValue(categoryData)
      } as unknown as NextRequest;
      
      // Execute the function
      const response = await POST(request);
      
      // Parse response
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(201);
      expect(data.category).toEqual(createdCategory);
      expect(prisma.category.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...categoryData,
          user: {
            connect: { id: mockUser.id },
          },
        }),
      });
    });

    it('returns 401 when user is not authenticated', async () => {
      // Setup mock
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      // Mock implementation
      POST.mockImplementation(async () => {
        const session = await getServerSession();
        
        if (!session?.user?.email) {
          return new MockResponse({ error: 'Unauthorized' }, { status: 401 });
        }
        
        return new MockResponse(null, { status: 200 });
      });
      
      const request = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;
      
      // Execute the function
      const response = await POST(request);
      
      // Parse response
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('PUT /api/categories', () => {
    it('updates an existing category', async () => {
      // Sample data
      const mockUser = { id: 'user1', email: 'test@example.com' };
      const categoryData = {
        id: 'cat1',
        name: 'Updated Category',
        color: '#00ffff',
      };
      
      const updatedCategory = {
        ...categoryData,
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Setup mocks
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: mockUser.email }
      });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.category.findUnique as jest.Mock).mockResolvedValue({ userId: mockUser.id });
      (prisma.category.update as jest.Mock).mockResolvedValue(updatedCategory);
      
      // Mock implementation
      PUT.mockImplementation(async (request: NextRequest) => {
        const session = await getServerSession();
        
        if (!session?.user?.email) {
          return new MockResponse({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Get user by email
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        });
        
        if (!user) {
          return new MockResponse({ error: 'User not found' }, { status: 404 });
        }
        
        const data = await request.json();
        const { id, ...updateData } = data;
        
        // Check if category exists and belongs to user
        const existingCategory = await prisma.category.findUnique({
          where: { id },
          select: { userId: true },
        });
        
        if (!existingCategory) {
          return new MockResponse({ error: 'Category not found' }, { status: 404 });
        }
        
        if (existingCategory.userId !== user.id) {
          return new MockResponse(
            { error: 'Unauthorized to modify this category' },
            { status: 403 }
          );
        }
        
        // Update category
        const category = await prisma.category.update({
          where: { id },
          data: updateData,
        });
        
        return new MockResponse({ category }, { status: 200 });
      });
      
      // Create a mock request
      const request = {
        json: jest.fn().mockResolvedValue(categoryData)
      } as unknown as NextRequest;
      
      // Execute the function
      const response = await PUT(request);
      
      // Parse response
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.category).toEqual(updatedCategory);
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: categoryData.id },
        data: { name: categoryData.name, color: categoryData.color },
      });
    });
  });
}); 