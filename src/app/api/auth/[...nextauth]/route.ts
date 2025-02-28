import { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth/next';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing Google OAuth Credentials');
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          // Create default user settings when a user signs up with Google
          settings: {
            create: {},
          },
        };
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error('Invalid credentials');
        }

        return user;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user, _account, _profile }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { settings: true },
          });

          // If user doesn't exist, create default settings
          if (!existingUser?.settings) {
            await prisma.userSettings.create({
              data: {
                userId: user.id,
              },
            });

            // Create default categories for new Google users
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
          }
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      return true;
    },
  },
};

// Use the named exports for Next.js App Router API handlers
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 