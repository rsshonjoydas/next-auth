import { PrismaAdapter } from '@auth/prisma-adapter';
import { UserRole } from '@prisma/client';
import NextAuth from 'next-auth';

import authConfig from '@/auth.config';
import { getUserById } from '@/data/user';
import { db } from '@/lib/db';
import { getTwoFactorConfirmationByUserId } from './data/two-factor-confirmation';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // Allow OAuth without email verification
      if (account?.provider !== 'credentials') return true;

      const existingUser = await getUserById(user.id);

      // Prevent sign in without email verification
      if (!existingUser?.emailVerified) return false;

      if (existingUser.isTwoFactorEnabled) {
        const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id);

        if (!twoFactorConfirmation) return false;

        // Delete two factor confirmation for next sign in
        await db.twoFactorConfirmation.delete({
          where: { id: twoFactorConfirmation.id },
        });
      }

      return true;
    },
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
