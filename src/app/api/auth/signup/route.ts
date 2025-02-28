import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Log the incoming request
    console.log('Received signup request');

    // Ensure the request body can be parsed
    let body;
    try {
      body = await request.json();
      console.log('Request body parsed successfully');
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { name, email, password } = body;

    // Log the validation steps
    console.log('Validating input fields');

    if (!email || !password) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format');
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      console.log('Password too short');
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    console.log('Checking for existing user');
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('User already exists');
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    console.log('Hashing password');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with settings
    console.log('Creating new user');
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        settings: {
          create: {}, // Create default settings
        },
      },
    });

    // Create default categories for the user
    console.log('Creating default categories');
    const defaultCategories = [
      { name: 'Work', color: '#4A90E2' },
      { name: 'Personal', color: '#50E3C2' },
      { name: 'Health', color: '#FF5A5F' },
      { name: 'Shopping', color: '#FFB400' },
      { name: 'Learning', color: '#8E44AD' },
    ];

    await Promise.all(
      defaultCategories.map((category) =>
        prisma.category.create({
          data: {
            ...category,
            userId: user.id,
          },
        })
      )
    );

    console.log('User and categories created successfully');

    // Remove password from response
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;

    // Ensure we're returning a valid JSON response
    const response = {
      user: userWithoutPassword,
      message: 'User created successfully',
    };

    console.log('Sending success response');
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    // Log the full error
    console.error('Detailed error in signup:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      console.log('Error type:', error.constructor.name);
      console.log('Error message:', error.message);
      
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        );
      }
    }
    
    // Ensure we always return a valid JSON response
    return NextResponse.json(
      { 
        error: 'An error occurred during registration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 