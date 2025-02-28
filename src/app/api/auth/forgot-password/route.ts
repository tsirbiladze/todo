import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // We don't want to reveal whether a user exists or not for security reasons
    // So we always return success, even if no user is found
    if (!user) {
      return NextResponse.json({
        message: 'If an account with that email exists, we have sent a password reset link'
      });
    }

    // Generate a reset token that expires in 1 hour
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save the reset token in the database
    await prisma.verificationToken.create({
      data: {
        identifier: user.email!,
        token: resetToken,
        expires: resetTokenExpiry,
      },
    });

    // Construct the reset URL
    const resetUrl = `${BASE_URL}/auth/reset-password?token=${resetToken}`;

    // Send the reset email
    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev', // Replace with your verified email
        to: user.email!,
        subject: 'Reset your password',
        html: `
          <h1>Reset Your Password</h1>
          <p>You requested a password reset for your account.</p>
          <p>Click the link below to reset your password. This link is valid for 1 hour.</p>
          <a href="${resetUrl}" style="padding: 10px; background-color: #4a90e2; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { message: 'Failed to send reset email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'If an account with that email exists, we have sent a password reset link'
    });
  } catch (error) {
    console.error('Error in password reset request:', error);
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 }
    );
  }
} 