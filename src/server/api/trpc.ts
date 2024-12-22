import { initTRPC } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';

type CreateContextOptions = Record<string, never>;

const createInnerTRPCContext = async (_opts: CreateContextOptions) => {
  return {
    prisma,
  };
};

export const createTRPCContext = async (_opts: CreateNextContextOptions) => {
  const session = await getServerSession(authOptions);
  return {
    session,
    prisma,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new Error('Not authenticated');
  }
  return next({
    ctx: {
      session: ctx.session,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
