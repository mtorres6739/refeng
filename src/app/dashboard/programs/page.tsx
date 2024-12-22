'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

interface ReferralProgram {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  incentives: Incentive[];
}

interface Incentive {
  id: string;
  name: string;
  description: string | null;
  type: 'CASH' | 'POINTS' | 'GIFT_CARD' | 'PRODUCT';
  value: number;
}

export default function ProgramsPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/signin');
    },
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [programs, setPrograms] = useState<ReferralProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPrograms = async () => {
    try {
      console.log('Fetching programs...');
      const response = await fetch('/api/programs');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(errorText || 'Failed to fetch programs');
      }

      const data = await response.json();
      console.log('Programs data:', data);
      setPrograms(data);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setError('Failed to load referral programs');
      toast.error('Failed to load referral programs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPrograms();
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const incentives = [
      {
        name: formData.get('incentiveName'),
        description: formData.get('incentiveDescription'),
        type: formData.get('incentiveType'),
        value: parseFloat(formData.get('incentiveValue') as string),
      },
    ];

    try {
      const response = await fetch('/api/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description'),
          startDate: formData.get('startDate'),
          endDate: formData.get('endDate') || null,
          incentives,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create program');
      }

      setIsModalOpen(false);
      fetchPrograms();
    } catch (error) {
      console.error('Error creating program:', error);
    }
  };

  const toggleProgramStatus = async (programId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/programs/${programId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update program status');
      }

      fetchPrograms();
    } catch (error) {
      console.error('Error updating program status:', error);
    }
  };

  const handleGenerateLink = async (programId: string) => {
    try {
      const response = await fetch(`/api/programs/${programId}/generate-link`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate referral link');
      }
      
      const data = await response.json();
      // Copy link to clipboard
      await navigator.clipboard.writeText(data.referralLink);
      toast.success('Referral link copied to clipboard!');
    } catch (error) {
      console.error('Error generating link:', error);
      toast.error('Failed to generate referral link');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Referral Programs</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your referral programs and incentives
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Program
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Loading programs...
          </div>
        ) : programs.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No referral programs yet
          </div>
        ) : (
          programs.map((program) => (
            <div
              key={program.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {program.name}
                  </h3>
                  <button
                    onClick={() => toggleProgramStatus(program.id, !program.isActive)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      program.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {program.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
                {program.description && (
                  <p className="mt-2 text-sm text-gray-600">{program.description}</p>
                )}
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600">
                    Start Date: {format(new Date(program.startDate), 'MMM d, yyyy')}
                  </p>
                  {program.endDate && (
                    <p className="text-sm text-gray-600">
                      End Date: {format(new Date(program.endDate), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Incentives</h4>
                  <div className="mt-2 space-y-2">
                    {program.incentives.map((incentive) => (
                      <div
                        key={incentive.id}
                        className="bg-gray-50 rounded-md p-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {incentive.name}
                            </p>
                            {incentive.description && (
                              <p className="text-sm text-gray-600">
                                {incentive.description}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-gray-900">
                            {incentive.type === 'CASH' && '$'}
                            {incentive.value}
                            {incentive.type === 'POINTS' && ' points'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => handleGenerateLink(program.id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Generate Referral Link
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Program Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create Referral Program</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Program Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      id="startDate"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      id="endDate"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-900">Incentive</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="incentiveName" className="block text-sm font-medium text-gray-700">
                        Incentive Name
                      </label>
                      <input
                        type="text"
                        name="incentiveName"
                        id="incentiveName"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="incentiveDescription" className="block text-sm font-medium text-gray-700">
                        Incentive Description
                      </label>
                      <input
                        type="text"
                        name="incentiveDescription"
                        id="incentiveDescription"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="incentiveType" className="block text-sm font-medium text-gray-700">
                          Type
                        </label>
                        <select
                          name="incentiveType"
                          id="incentiveType"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="CASH">Cash</option>
                          <option value="POINTS">Points</option>
                          <option value="GIFT_CARD">Gift Card</option>
                          <option value="PRODUCT">Product</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="incentiveValue" className="block text-sm font-medium text-gray-700">
                          Value
                        </label>
                        <input
                          type="number"
                          name="incentiveValue"
                          id="incentiveValue"
                          required
                          min="0"
                          step="0.01"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
