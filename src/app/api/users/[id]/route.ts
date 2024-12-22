import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== GET /api/users/[id] Start ===');
    console.log('Request URL:', req.url);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    console.log('Params:', params);

    const session = await getServerSession(authOptions);

    console.log('Full session:', JSON.stringify(session, null, 2));
    console.log('Session data:', {
      email: session?.user?.email,
      role: session?.user?.role,
      orgId: session?.user?.orgId,
      user: session?.user ? JSON.stringify(session.user) : null
    });

    if (!session?.user?.email) {
      console.log('Unauthorized - No session user email');
      return NextResponse.json({ error: 'Please sign in to view user profiles' }, { status: 401 });
    }

    if (!session.user.role) {
      console.log('Unauthorized - No session user role');
      return NextResponse.json({ error: 'User role not found in session' }, { status: 401 });
    }

    if (!params.id) {
      console.log('Bad Request - No user ID provided');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // For non-SUPER_ADMIN users, verify they have an orgId
    if (session.user.role !== UserRole.SUPER_ADMIN && !session.user.orgId) {
      console.log('Unauthorized - Non-admin user missing orgId');
      return NextResponse.json(
        { error: 'Organization not found in session' },
        { status: 401 }
      );
    }

    // First check if the user exists
    try {
      console.log('Attempting to find user with ID:', params.id);
      const userExists = await prisma.user.findUnique({
        where: { id: params.id },
        select: { 
          id: true, 
          orgId: true,
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      console.log('User exists check result:', JSON.stringify(userExists, null, 2));

      if (!userExists) {
        console.log('User not found');
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Check organization access for non-SUPER_ADMIN users
      if (session.user.role !== UserRole.SUPER_ADMIN && userExists.orgId !== session.user.orgId) {
        console.log('Organization mismatch:', {
          userOrgId: userExists.orgId,
          userOrg: userExists.organization?.name,
          sessionOrgId: session.user.orgId
        });
        return NextResponse.json(
          { error: 'You do not have permission to view this user' },
          { status: 403 }
        );
      }

      // Then fetch the full user data
      const fullQuery = {
        where: { id: params.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          orgId: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              createdAt: true,
              updatedAt: true
            }
          },
          referrals: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
              createdAt: true
            }
          },
          contentShares: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              platform: true,
              clicks: true,
              engagements: true,
              createdAt: true,
              content: {
                select: {
                  id: true,
                  title: true,
                  points: true
                }
              }
            }
          },
          drawingEntries: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              createdAt: true,
              drawing: {
                select: {
                  id: true,
                  name: true,
                  prize: true,
                  drawDate: true
                }
              }
            }
          }
        }
      };

      console.log('Attempting to fetch full user data with query:', JSON.stringify(fullQuery, null, 2));

      const user = await prisma.user.findUnique(fullQuery);

      console.log('Full user query result:', {
        found: !!user,
        id: user?.id,
        email: user?.email,
        orgId: user?.orgId,
        organization: user?.organization?.name,
        referralsCount: user?.referrals?.length,
        contentSharesCount: user?.contentShares?.length,
        drawingEntriesCount: user?.drawingEntries?.length
      });

      if (!user) {
        console.log('User not found after full query');
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Initialize arrays and handle null organization
      const sanitizedUser = {
        ...user,
        organization: user.organization || null,
        referrals: user.referrals || [],
        contentShares: user.contentShares || [],
        drawingEntries: user.drawingEntries || []
      };

      console.log('Returning sanitized user data:', JSON.stringify({
        id: sanitizedUser.id,
        email: sanitizedUser.email,
        orgId: sanitizedUser.orgId,
        organization: sanitizedUser.organization?.name,
        referralsCount: sanitizedUser.referrals.length,
        contentSharesCount: sanitizedUser.contentShares.length,
        drawingEntriesCount: sanitizedUser.drawingEntries.length
      }, null, 2));

      return NextResponse.json(sanitizedUser);
    } catch (error) {
      console.error('Error fetching user data:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        code: error instanceof Error ? (error as any).code : undefined,
        meta: error instanceof Error ? (error as any).meta : undefined,
      });
      return NextResponse.json(
        { error: 'Error fetching user data', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unhandled error in GET /api/users/[id]:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: error instanceof Error ? (error as any).code : undefined,
      meta: error instanceof Error ? (error as any).meta : undefined,
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== PUT /api/users/[id] Start ===');
    const session = await getServerSession(authOptions);

    console.log('PUT /api/users/[id] - Session:', JSON.stringify(session, null, 2));
    console.log('PUT /api/users/[id] - Session user:', JSON.stringify(session?.user, null, 2));
    console.log('PUT /api/users/[id] - Params:', params);

    if (!session?.user?.email) {
      console.log('PUT /api/users/[id] - No session user email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.role) {
      console.log('PUT /api/users/[id] - No session user role');
      return NextResponse.json({ error: 'Unauthorized - No role' }, { status: 401 });
    }

    // Allow both SUPER_ADMIN and ADMIN to update user profiles
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.ADMIN) {
      console.log('PUT /api/users/[id] - Not admin or super admin');
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const data = await req.json();

    console.log('PUT /api/users/[id] - Request data:', JSON.stringify(data, null, 2));

    // For ADMIN, verify they can only update users in their organization
    let targetUser = null;
    try {
      targetUser = await prisma.user.findUnique({
        where: { id: params.id },
      });
    } catch (error) {
      console.error('Error finding target user:', {
        error,
        message: error.message,
        code: error.code,
        meta: error.meta
      });
      return NextResponse.json(
        { error: 'Error finding target user', details: error.message },
        { status: 500 }
      );
    }

    console.log('PUT /api/users/[id] - Target user:', JSON.stringify(targetUser, null, 2));

    if (!targetUser) {
      console.log('PUT /api/users/[id] - User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (session.user.role === UserRole.ADMIN && targetUser.orgId !== session.user.orgId) {
      console.log('PUT /api/users/[id] - Not in same organization');
      return NextResponse.json(
        { error: 'Unauthorized - Cannot modify users from other organizations' },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.password) updateData.password = await bcrypt.hash(data.password, 10);
    if (data.role) updateData.role = data.role;

    console.log('PUT /api/users/[id] - Update data:', JSON.stringify(updateData, null, 2));

    let updatedUser = null;
    try {
      console.log('Attempting to update user with query:', {
        where: { id: params.id },
        data: updateData
      });

      updatedUser = await prisma.user.update({
        where: { id: params.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          points: true,
          totalEarned: true,
          lastActive: true,
          createdAt: true,
          updatedAt: true,
          salesforceUrl: true,
          org: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error updating user:', {
        error,
        message: error.message,
        code: error.code,
        meta: error.meta
      });
      return NextResponse.json(
        { error: 'Error updating user', details: error.message },
        { status: 500 }
      );
    }

    console.log('PUT /api/users/[id] - Updated user:', JSON.stringify(updatedUser, null, 2));

    const transformedUser = {
      ...updatedUser,
      organization: {
        id: updatedUser.org.id,
        name: updatedUser.org.name,
      },
      org: undefined,
    };

    console.log('=== PUT /api/users/[id] End ===');
    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error('Error in PUT /api/users/[id]:', {
      error,
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== PATCH /api/users/[id] Start ===');
    const session = await getServerSession(authOptions);

    console.log('PATCH /api/users/[id] - Session:', JSON.stringify(session, null, 2));
    console.log('PATCH /api/users/[id] - Session user:', JSON.stringify(session?.user, null, 2));
    console.log('PATCH /api/users/[id] - Params:', params);

    if (!session?.user?.email) {
      console.log('PATCH /api/users/[id] - No session user email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.role) {
      console.log('PATCH /api/users/[id] - No session user role');
      return NextResponse.json({ error: 'Unauthorized - No role' }, { status: 401 });
    }

    // Only SUPER_ADMIN can update user roles and organizations
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      console.log('PATCH /api/users/[id] - Not super admin');
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    const data = await req.json();

    console.log('PATCH /api/users/[id] - Request data:', JSON.stringify(data, null, 2));

    const { role, orgId } = data;

    // Check if user exists
    let targetUser = null;
    try {
      targetUser = await prisma.user.findUnique({
        where: { id: params.id },
      });
    } catch (error) {
      console.error('Error finding target user:', {
        error,
        message: error.message,
        code: error.code,
        meta: error.meta
      });
      return NextResponse.json(
        { error: 'Error finding target user', details: error.message },
        { status: 500 }
      );
    }

    console.log('PATCH /api/users/[id] - Target user:', JSON.stringify(targetUser, null, 2));

    if (!targetUser) {
      console.log('PATCH /api/users/[id] - User not found');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Don't allow changing your own role or organization
    if (targetUser.email === session.user.email) {
      console.log('PATCH /api/users/[id] - Cannot modify own role or organization');
      return NextResponse.json(
        { error: 'Cannot modify your own role or organization' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    // Validate and set role update
    if (role) {
      if (!Object.values(UserRole).includes(role)) {
        console.log('PATCH /api/users/[id] - Invalid role');
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    // Validate and set organization update
    if (orgId) {
      let organization = null;
      try {
        organization = await prisma.organization.findUnique({
          where: { id: orgId },
        });
      } catch (error) {
        console.error('Error finding organization:', {
          error,
          message: error.message,
          code: error.code,
          meta: error.meta
        });
        return NextResponse.json(
          { error: 'Error finding organization', details: error.message },
          { status: 500 }
        );
      }

      console.log('PATCH /api/users/[id] - Organization:', JSON.stringify(organization, null, 2));

      if (!organization) {
        console.log('PATCH /api/users/[id] - Organization not found');
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }
      updateData.organizationId = orgId;
    }

    console.log('PATCH /api/users/[id] - Update data:', JSON.stringify(updateData, null, 2));

    let updatedUser = null;
    try {
      console.log('Attempting to update user with query:', {
        where: { id: params.id },
        data: updateData
      });

      updatedUser = await prisma.user.update({
        where: { id: params.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          points: true,
          totalEarned: true,
          lastActive: true,
          createdAt: true,
          updatedAt: true,
          salesforceUrl: true,
          org: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error updating user:', {
        error,
        message: error.message,
        code: error.code,
        meta: error.meta
      });
      return NextResponse.json(
        { error: 'Error updating user', details: error.message },
        { status: 500 }
      );
    }

    console.log('PATCH /api/users/[id] - Updated user:', JSON.stringify(updatedUser, null, 2));

    const transformedUser = {
      ...updatedUser,
      organization: {
        id: updatedUser.org.id,
        name: updatedUser.org.name,
      },
      org: undefined,
    };

    console.log('=== PATCH /api/users/[id] End ===');
    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error('Error in PATCH /api/users/[id]:', {
      error,
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== DELETE /api/users/[id] Start ===');
    const session = await getServerSession(authOptions);

    console.log('DELETE /api/users/[id] - Session:', JSON.stringify(session, null, 2));
    console.log('DELETE /api/users/[id] - Session user:', JSON.stringify(session?.user, null, 2));
    console.log('DELETE /api/users/[id] - Params:', params);

    if (!session?.user?.email) {
      console.log('DELETE /api/users/[id] - No session user email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.role) {
      console.log('DELETE /api/users/[id] - No session user role');
      return NextResponse.json({ error: 'Unauthorized - No role' }, { status: 401 });
    }

    // Allow both SUPER_ADMIN and ADMIN to delete users
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.ADMIN) {
      console.log('DELETE /api/users/[id] - Not admin or super admin');
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // For non-SUPER_ADMIN users, verify they have an orgId
    if (session.user.role !== UserRole.SUPER_ADMIN && !session.user.orgId) {
      console.log('Unauthorized - Non-admin user missing orgId');
      return NextResponse.json(
        { error: 'User organization not found' },
        { status: 401 }
      );
    }

    // For ADMIN, verify they can only delete users in their organization
    let targetUser = null;
    try {
      targetUser = await prisma.user.findUnique({
        where: { id: params.id },
      });
    } catch (error) {
      console.error('Error finding target user:', {
        error,
        message: error.message,
        code: error.code,
        meta: error.meta
      });
      return NextResponse.json(
        { error: 'Error finding target user', details: error.message },
        { status: 500 }
      );
    }

    console.log('DELETE /api/users/[id] - Target user:', JSON.stringify(targetUser, null, 2));

    if (!targetUser) {
      console.log('DELETE /api/users/[id] - User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (session.user.role === UserRole.ADMIN && targetUser.orgId !== session.user.orgId) {
      console.log('DELETE /api/users/[id] - Not in same organization');
      return NextResponse.json(
        { error: 'Unauthorized - Cannot delete users from other organizations' },
        { status: 403 }
      );
    }

    // Prevent deleting the last admin
    if (targetUser.role === UserRole.ADMIN) {
      let adminCount = null;
      try {
        adminCount = await prisma.user.count({
          where: {
            orgId: session.user.orgId,
            role: UserRole.ADMIN,
          },
        });
      } catch (error) {
        console.error('Error counting admins:', {
          error,
          message: error.message,
          code: error.code,
          meta: error.meta
        });
        return NextResponse.json(
          { error: 'Error counting admins', details: error.message },
          { status: 500 }
        );
      }

      console.log('DELETE /api/users/[id] - Admin count:', adminCount);

      if (adminCount <= 1) {
        console.log('DELETE /api/users/[id] - Cannot delete last admin');
        return NextResponse.json(
          { error: 'Cannot delete the last admin user' },
          { status: 400 }
        );
      }
    }

    try {
      console.log('Attempting to delete user with query:', {
        where: { id: params.id }
      });

      await prisma.user.delete({
        where: { id: params.id },
      });

      console.log('DELETE /api/users/[id] - Deleted user:', params.id);

      console.log('=== DELETE /api/users/[id] End ===');
      return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', {
        error,
        message: error.message,
        code: error.code,
        meta: error.meta
      });
      return NextResponse.json(
        { error: 'Error deleting user', details: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in DELETE /api/users/[id]:', {
      error,
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
