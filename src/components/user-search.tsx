'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { UserRole } from '@prisma/client';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  organization: {
    id: string;
    name: string;
  } | null;
  orgId: string | null;
}

interface UserSearchProps {
  onSelect: (user: User | null) => void;
  selectedUser?: User | null;
}

export function UserSearch({ onSelect, selectedUser }: UserSearchProps) {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [showResults, setShowResults] = React.useState(false);

  const fetchUsers = async (searchTerm: string = '') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users?search=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users on mount
  React.useEffect(() => {
    fetchUsers();
  }, []);

  // Handle search
  React.useEffect(() => {
    if (search.length > 0) {
      const delayDebounceFn = setTimeout(() => {
        fetchUsers(search);
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [search]);

  const handleSelect = (user: User) => {
    onSelect(user);
    setShowResults(false);
  };

  const handleClear = () => {
    onSelect(null);
    setSearch('');
  };

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search users..."
            value={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : search}
            onChange={(e) => {
              if (!selectedUser) {
                setSearch(e.target.value);
                setShowResults(true);
              }
            }}
            onFocus={() => !selectedUser && setShowResults(true)}
          />
          {selectedUser && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {showResults && !selectedUser && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {loading ? (
            <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
              Loading...
            </div>
          ) : users.length === 0 ? (
            <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
              No users found
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="relative cursor-pointer select-none px-4 py-2 text-gray-900 hover:bg-gray-100"
                onClick={() => handleSelect(user)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{user.name || 'Unnamed User'}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  {selectedUser?.id === user.id && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
