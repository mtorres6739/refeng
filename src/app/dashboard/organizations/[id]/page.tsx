import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ReferralActivityChart } from '@/components/ReferralActivityChart';

interface PageProps {
  params: {
    id: string;
  };
}

async function getOrganizationData(id: string) {
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          lastActive: true,
          createdAt: true,
        },
      },
      referrals: {
        include: {
          status: true,
        },
      },
      _count: {
        select: {
          users: true,
          referrals: true,
          rewards: true,
          programs: true,
        },
      },
    },
  });

  if (!org) {
    throw new Error('Organization not found');
  }

  // Calculate monthly referral stats
  const referralsByMonth: Record<string, number> = {};
  org.referrals.forEach((referral) => {
    const month = format(new Date(referral.createdAt), 'MMM yyyy');
    referralsByMonth[month] = (referralsByMonth[month] || 0) + 1;
  });

  const stats = {
    totalUsers: org._count.users,
    activeUsers: org.users.filter(user => 
      user.lastActive && new Date(user.lastActive) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length,
    totalReferrals: org._count.referrals,
    totalRewards: org._count.rewards,
    activePrograms: org._count.programs,
    referralsByMonth,
  };

  return { org, stats };
}

export default async function OrganizationProfile({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
    throw new Error('Unauthorized');
  }

  const { org, stats } = await getOrganizationData(params.id);

  const chartData = Object.entries(stats.referralsByMonth).map(([month, count]) => ({
    month,
    count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{org.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
          <p className="text-2xl font-bold">{stats.activeUsers}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Referrals</h3>
          <p className="text-2xl font-bold">{stats.totalReferrals}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Rewards</h3>
          <p className="text-2xl font-bold">{stats.totalRewards}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Active Programs</h3>
          <p className="text-2xl font-bold">{stats.activePrograms}</p>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="text-xl font-bold mb-4">Referral Activity</h2>
        <ReferralActivityChart data={chartData} />
      </Card>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Member Since</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {org.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name || 'No name'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === UserRole.ADMIN ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.lastActive ? format(new Date(user.lastActive), 'PPp') : 'Never'}
                  </TableCell>
                  <TableCell>{format(new Date(user.createdAt), 'PP')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="referrals">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {org.referrals.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell>{referral.name}</TableCell>
                  <TableCell>{referral.email}</TableCell>
                  <TableCell>
                    <Badge
                      style={{
                        backgroundColor: referral.status.color,
                        color: 'white',
                      }}
                    >
                      {referral.status.name}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(referral.createdAt), 'PP')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
