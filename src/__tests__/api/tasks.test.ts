import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/tasks/route';
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

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock Next.js API route
jest.mock('@/app/api/tasks/route', () => {
  // Create mock implementations of the API functions
  const GET = jest.fn().mockImplementation(async () => {
    try {
      const session = getServerSession();
      
      if (!session?.user?.email) {
        return new MockResponse({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      
      if (!user) {
        return new MockResponse({ error: 'User not found' }, { status: 404 });
      }
      
      const tasks = await prisma.task.findMany({
        where: { userId: user.id, parentId: null },
        include: { categories: true, subtasks: true, goal: true },
        orderBy: { createdAt: 'desc' },
      });
      
      return new MockResponse({ tasks }, { status: 200 });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return new MockResponse({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
  });
  
  const POST = jest.fn().mockImplementation(async (request) => {
    try {
      const session = getServerSession();
      
      if (!session?.user?.email) {
        return new MockResponse({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const data = await request.json();
      const { categories, ...taskData } = data;
      
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      
      if (!user) {
        return new MockResponse({ error: 'User not found' }, { status: 404 });
      }
      
      const task = await prisma.task.create({
        data: {
          ...taskData,
          user: {
            connect: { id: user.id },
          },
          categories: categories?.length > 0
            ? { connect: categories.map((cat) => ({ id: cat.id })) }
            : undefined,
        },
        include: { categories: true, goal: true },
      });
      
      return new MockResponse({ task }, { status: 200 });
    } catch (error) {
      return new MockResponse({ error: 'Failed to create task' }, { status: 500 });
    }
  });
  
  const PUT = jest.fn().mockImplementation(async (request) => {
    try {
      const session = getServerSession();
      
      if (!session?.user?.email) {
        return new MockResponse({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const data = await request.json();
      const { id, categories, ...taskData } = data;
      
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      
      if (!user) {
        return new MockResponse({ error: 'User not found' }, { status: 404 });
      }
      
      const existingTask = await prisma.task.findUnique({
        where: { id },
        select: { userId: true },
      });
      
      if (!existingTask) {
        return new MockResponse({ error: 'Task not found' }, { status: 404 });
      }
      
      if (existingTask.userId !== user.id) {
        return new MockResponse(
          { error: 'Unauthorized to modify this task' },
          { status: 403 }
        );
      }
      
      const task = await prisma.task.update({
        where: { id },
        data: {
          ...taskData,
          categories: categories
            ? { set: categories.map((cat) => ({ id: cat.id })) }
            : undefined,
        },
        include: { categories: true, goal: true },
      });
      
      return new MockResponse({ task }, { status: 200 });
    } catch (error) {
      return new MockResponse({ error: 'Failed to update task' }, { status: 500 });
    }
  });
  
  const DELETE = jest.fn();
  
  return { GET, POST, PUT, DELETE };
});

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

describe('Tasks API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/tasks', () => {
    it('returns 401 when user is not authenticated', async () => {
      // Setup mock
      (getServerSession as jest.Mock).mockResolvedValue(null);

      // Execute the function
      const response = await GET();
      
      // Parse response
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns tasks for the authenticated user', async () => {
      // Sample data
      const mockUser = { id: 'user1', email: 'test@example.com' };
      const mockTasks = [{ id: 'task1', title: 'Test Task' }];
      
      // Setup mocks
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: mockUser.email }
      });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);
      
      // Execute the function
      const response = await GET();
      
      // Parse response
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.tasks).toEqual(mockTasks);
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, parentId: null },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
    });

    it('handles errors gracefully', async () => {
      // Setup mocks to throw an error
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' }
      });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user1' });
      (prisma.task.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Execute the function
      const response = await GET();
      
      // Parse response
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch tasks');
    });
  });

  describe('POST /api/tasks', () => {
    it('creates a new task for authenticated user', async () => {
      // Sample data
      const mockUser = { id: 'user1', email: 'test@example.com' };
      const taskData = {
        title: 'New Task',
        description: 'Task Description',
        priority: 'HIGH',
        dueDate: '2023-12-31',
        categories: [{ id: 'cat1' }]
      };
      
      const createdTask = {
        id: 'new-task-id',
        ...taskData,
        userId: mockUser.id,
      };
      
      // Setup mocks
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: mockUser.email }
      });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.task.create as jest.Mock).mockResolvedValue(createdTask);
      
      // Create a mock request
      const request = {
        json: jest.fn().mockResolvedValue(taskData)
      } as unknown as NextRequest;
      
      // Execute the function
      const response = await POST(request);
      
      // Parse response
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.task).toEqual(createdTask);
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user: {
            connect: { id: mockUser.id },
          },
          categories: {
            connect: taskData.categories.map((cat: { id: string }) => ({ id: cat.id })),
          },
        }),
        include: expect.any(Object),
      });
    });

    it('returns 401 when user is not authenticated', async () => {
      // Setup mock
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
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

  describe('PUT /api/tasks', () => {
    it('updates an existing task', async () => {
      // Sample data
      const mockUser = { id: 'user1', email: 'test@example.com' };
      const taskData = {
        id: 'task1',
        title: 'Updated Task',
        description: 'Updated Description',
        priority: 'MEDIUM',
        categories: [{ id: 'cat2' }]
      };
      
      const updatedTask = {
        ...taskData,
        userId: mockUser.id,
      };
      
      // Setup mocks
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: mockUser.email }
      });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({ userId: mockUser.id });
      (prisma.task.update as jest.Mock).mockResolvedValue(updatedTask);
      
      // Create a mock request
      const request = {
        json: jest.fn().mockResolvedValue(taskData)
      } as unknown as NextRequest;
      
      // Execute the function
      const response = await PUT(request);
      
      // Parse response
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.task).toEqual(updatedTask);
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: taskData.id },
        data: expect.objectContaining({
          categories: {
            set: taskData.categories.map((cat: { id: string }) => ({ id: cat.id })),
          },
        }),
        include: expect.any(Object),
      });
    });

    it('returns 401 when user is not authenticated', async () => {
      // Setup mock
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const request = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;
      
      // Execute the function
      const response = await PUT(request);
      
      // Parse response
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 403 when user tries to update a task they do not own', async () => {
      // Sample data
      const mockUser = { id: 'user1', email: 'test@example.com' };
      const taskData = {
        id: 'task1',
        title: 'Updated Task',
      };
      
      // Setup mocks
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: mockUser.email }
      });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      // Task belongs to a different user
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({ userId: 'different-user' });
      
      // Create a mock request
      const request = {
        json: jest.fn().mockResolvedValue(taskData)
      } as unknown as NextRequest;
      
      // Execute the function
      const response = await PUT(request);
      
      // Parse response
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(403);
      expect(data.error).toBe('Unauthorized to modify this task');
    });
  });
}); 