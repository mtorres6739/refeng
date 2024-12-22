import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log("=== Auth Debug Start ===");
          console.log("1. Received credentials:", {
            email: credentials?.email,
            hasPassword: !!credentials?.password,
          });

          if (!credentials?.email || !credentials?.password) {
            console.log("2. Missing credentials");
            throw new Error("Invalid credentials");
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  createdAt: true,
                  updatedAt: true
                }
              }
            }
          });

          console.log("3. Database query result:", {
            found: !!user,
            userId: user?.id,
            userEmail: user?.email,
            userRole: user?.role,
            orgId: user?.orgId,
            orgName: user?.organization?.name
          });

          if (!user) {
            console.log("4. User not found");
            throw new Error("Invalid credentials");
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password || ""
          );

          console.log("5. Password validation:", {
            isValid: isValidPassword,
          });

          if (!isValidPassword) {
            console.log("6. Invalid password");
            throw new Error("Invalid credentials");
          }

          console.log("7. Auth successful, returning user:", {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            orgId: user.orgId,
            organization: user.organization
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            orgId: user.orgId,
            organization: user.organization
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('JWT Callback Input:', { 
        tokenId: token?.id,
        tokenEmail: token?.email,
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
        userOrgId: user?.orgId,
        userOrg: user?.organization
      });

      if (user) {
        // When signing in
        token.id = user.id;
        token.email = user.email;
        token.name = user.name || null;
        token.role = user.role || UserRole.CLIENT;
        token.orgId = user.orgId || null;
        token.organization = user.organization || null;
      } else if (!token.role) {
        // Ensure role is set if missing
        token.role = UserRole.CLIENT;
      }

      console.log('JWT Callback Output:', { 
        id: token.id,
        email: token.email,
        role: token.role,
        orgId: token.orgId,
        organization: token.organization
      });

      return token;
    },

    async session({ session, token }) {
      console.log('Session Callback Input:', { 
        sessionUser: session?.user,
        tokenId: token?.id,
        tokenEmail: token?.email,
        tokenRole: token?.role,
        tokenOrgId: token?.orgId,
        tokenOrg: token?.organization
      });

      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name || null,
          role: token.role || UserRole.CLIENT,
          orgId: token.orgId || null,
          organization: token.organization || null
        };
      }

      console.log('Session Callback Output:', { 
        id: session?.user?.id,
        email: session?.user?.email,
        role: session?.user?.role,
        orgId: session?.user?.orgId,
        organization: session?.user?.organization
      });

      return session;
    },
  },
  debug: true,
};
