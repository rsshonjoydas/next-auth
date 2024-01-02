import { PrismaAdapter } from '@auth/prisma-adapter';
import { UserRole } from '@prisma/client';
import NextAuth from 'next-auth';

import authConfig from '@/auth.config';
import { getUserById } from '@/data/user';
import { db } from '@/lib/db';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  callbacks: {
    async session({ token, session }) {
      try {
        const updatedSession = { ...session }; // Create a new object using the spread operator

        if (token.sub && updatedSession.user) {
          // Ensure consistency with your data model
          updatedSession.user.id = token.sub;
        }

        if (token.role && updatedSession.user) {
          // Ensure consistency with your data model
          updatedSession.user.role = token.role as UserRole;
        }

        return updatedSession;
      } catch (error) {
        console.error('Error in session callback:', error);
        throw error;
      }
    },
    async jwt({ token }) {
      try {
        if (!token.sub) return token;

        const existingUser = await getUserById(token.sub);

        if (!existingUser) return token;

        // Create a new object using the spread operator and assign the role property
        const updatedToken = { ...token, role: existingUser.role };

        return updatedToken;
      } catch (error) {
        console.error('Error in jwt callback:', error);
        throw error;
      }
    },
  },
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  ...authConfig,
});