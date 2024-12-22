'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format, isValid } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  points: number;
  totalEarned: number;
  lastActive: string | null;
  createdAt: string;
  updatedAt: string;
  organization: {
    id: string;
    name: string;
  };
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<{
    name: string;
  } | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.email) {
      setIsLoading(false);
      return;
    }

    fetchUser();
  }, [session, status]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    if (!user) return;
    setEditedUser({
      name: user.name || '',
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUser(null);
  };

  const handleSave = async () => {
    if (!editedUser) return;

    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedUser),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const updatedUser = await response.json();
      setUser(updatedUser);
      setIsEditing(false);
      setEditedUser(null);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please sign in to view your profile</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>
            View and manage your profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {isEditing ? (
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editedUser?.name || ''}
                    onChange={(e) =>
                      setEditedUser((prev) => ({
                        ...prev!,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
              ) : (
                <>
                  <div>
                    <Label>Name</Label>
                    <p className="mt-1">{user.name || 'Not set'}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="mt-1">{user.email}</p>
                  </div>
                  <div>
                    <Label>Organization</Label>
                    <p className="mt-1">{user.organization.name}</p>
                  </div>
                  <div>
                    <Label>Role</Label>
                    <p className="mt-1">{user.role}</p>
                  </div>
                  <div>
                    <Label>Points Balance</Label>
                    <p className="mt-1">{user.points}</p>
                  </div>
                  <div>
                    <Label>Total Points Earned</Label>
                    <p className="mt-1">{user.totalEarned}</p>
                  </div>
                  <div>
                    <Label>Member Since</Label>
                    <p className="mt-1">
                      {user.createdAt ? (isValid(new Date(user.createdAt)) ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'Invalid date') : 'Not available'}
                    </p>
                  </div>
                  <div>
                    <Label>Last Active</Label>
                    <p className="mt-1">
                      {user.lastActive ? (isValid(new Date(user.lastActive)) ? format(new Date(user.lastActive), 'MMM d, yyyy') : 'Invalid date') : 'Never'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          {isEditing ? (
            <div className="flex space-x-2">
              <Button onClick={handleSave}>Save Changes</Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button onClick={handleEdit}>Edit Profile</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
