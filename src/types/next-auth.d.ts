import 'next-auth';
import { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    id: string;
    name?: string | null;
    email: string;
    role: UserRole;
    orgId?: string | null;
  }

  interface Session {
    user: User;
    expires: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    orgId?: string | null;
  }
}
