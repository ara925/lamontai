// Define user type
export interface MockUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  createdAt: string;
}

// Mock users for development environment
export const users: MockUser[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: '$2a$10$GQH.xCbZH1fKfP1jzDYsEuRlDZLjLdfQjKUvE3zwJpcJcYHO1Vqte', // password: admin123
    role: 'admin',
    createdAt: '2023-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Test User',
    email: 'user@example.com',
    password: '$2a$10$aboQRCxiBiOChFvZHKx.y.PtwxJhfFn7M/gWMrDJxLR51QWs4FP7W', // password: password123
    role: 'user',
    createdAt: '2023-01-02T00:00:00.000Z',
  }
]; 