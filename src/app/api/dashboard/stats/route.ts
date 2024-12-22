import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log('=== Dashboard Stats API Debug Start ===');
    console.log('Session:', JSON.stringify(session, null, 2));

    if (!session?.user?.id || !session?.user?.orgId) {
      console.error('No valid session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.orgId;
    console.log('Using orgId:', orgId);

    const [contentCount, sharesCount, clicksAndEngagements, referralsCount] = await Promise.all([
      // Total content
      prisma.content.count({
        where: { orgId }
      }),
      // Total shares
      prisma.contentShare.count({
        where: {
          content: {
            orgId
          }
        }
      }),
      // Total clicks and engagements
      prisma.contentShare.aggregate({
        where: {
          content: {
            orgId
          }
        },
        _sum: {
          clicks: true,
          engagements: true
        }
      }),
      // Total referrals
      prisma.referral.count({
        where: { orgId }
      })
    ]);

    const stats = {
      totalContent: contentCount,
      totalShares: sharesCount,
      totalClicks: clicksAndEngagements._sum.clicks || 0,
      totalEngagements: clicksAndEngagements._sum.engagements || 0,
      totalReferrals: referralsCount
    };

    console.log('Stats:', stats);
    console.log('=== Dashboard Stats API Debug End ===');
    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
