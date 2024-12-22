'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  orgId: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function RewardsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReward, setNewReward] = useState({
    name: '',
    description: '',
    pointsCost: 0,
  });

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const response = await fetch('/api/rewards');
      if (!response.ok) {
        throw new Error('Failed to fetch rewards');
      }
      const data = await response.json();
      setRewards(data);
    } catch (err) {
      setError('Failed to load rewards');
      console.error('Error fetching rewards:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReward),
      });

      if (!response.ok) {
        throw new Error('Failed to create reward');
      }

      await fetchRewards();
      setShowCreateModal(false);
      setNewReward({ name: '', description: '', pointsCost: 0 });
    } catch (err) {
      setError('Failed to create reward');
      console.error('Error creating reward:', err);
    }
  };

  const handleDeleteReward = async (rewardId: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) {
      return;
    }

    try {
      const response = await fetch(`/api/rewards/${rewardId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete reward');
      }

      await fetchRewards();
    } catch (err) {
      setError('Failed to delete reward');
      console.error('Error deleting reward:', err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rewards Management</h1>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Reward
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div>Loading rewards...</div>
      ) : rewards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No rewards available.</p>
          <p className="text-gray-500">Create a reward to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{reward.name}</h3>
                  <p className="text-gray-600 mt-1">{reward.description}</p>
                  <p className="text-blue-600 font-medium mt-2">
                    {reward.pointsCost} points
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteReward(reward.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Reward Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Reward</h2>
            <form onSubmit={handleCreateReward}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={newReward.name}
                  onChange={(e) =>
                    setNewReward({ ...newReward, name: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea
                  value={newReward.description}
                  onChange={(e) =>
                    setNewReward({ ...newReward, description: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Points Cost</label>
                <input
                  type="number"
                  value={newReward.pointsCost}
                  onChange={(e) =>
                    setNewReward({
                      ...newReward,
                      pointsCost: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2 border rounded"
                  min="0"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
