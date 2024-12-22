import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-100 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Referral Engine
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Grow your business through the power of referrals
          </p>
          <div className="space-x-4">
            <Link
              href="/auth/login"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            title="Easy Referrals"
            description="Submit and track referrals with just a few clicks"
            icon="👥"
          />
          <FeatureCard
            title="Rewards & Incentives"
            description="Earn rewards for successful referrals"
            icon="🎁"
          />
          <FeatureCard
            title="Social Sharing"
            description="Share content easily across social media platforms"
            icon="🌐"
          />
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
