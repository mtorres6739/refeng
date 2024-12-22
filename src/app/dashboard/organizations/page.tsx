'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  points: number;
  orgId: string;
}

interface Referral {
  id: string;
  name: string;
  email: string;
  status: {
    name: string;
    color: string;
  };
  createdAt: string;
}

interface Organization {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  users: User[];
  referrals: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    status: {
      name: string;
      color: string;
    };
  }[];
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    referrals: number;
    rewards: number;
    programs: number;
  };
}

export default function OrganizationsPage() {
  const { data: session } = useSession();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });

  useEffect(() => {
    if (session?.user?.role !== UserRole.SUPER_ADMIN) {
      setError('You do not have permission to view this page');
      setIsLoading(false);
      return;
    }
    fetchOrganizations();
  }, [session]);

  useEffect(() => {
    if (selectedOrg) {
      setFormData({
        name: selectedOrg.name,
        address: selectedOrg.address || '',
        city: selectedOrg.city || '',
        state: selectedOrg.state || '',
        zip: selectedOrg.zip || '',
      });
    }
  }, [selectedOrg]);

  const fetchOrganizations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/organizations');
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }
      const data = await response.json();
      setOrganizations(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create organization');
      }

      toast.success('Organization created successfully');
      setIsCreateModalOpen(false);
      setFormData({ name: '', address: '', city: '', state: '', zip: '' });
      fetchOrganizations();
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create organization');
    }
  };

  const handleUpdateOrg = async (orgId: string, data: Partial<Organization>) => {
    try {
      console.log('Updating organization:', orgId, data);
      const response = await fetch(`/api/organizations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Update error response:', error);
        throw new Error(error.error || 'Failed to update organization');
      }

      const result = await response.json();
      console.log('Update successful:', result);
      toast.success('Organization updated successfully');
      fetchOrganizations();
      setSelectedOrg(null);
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update organization');
    }
  };

  const handleDeleteOrg = async (orgId: string) => {
    if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${orgId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete organization');
      }

      toast.success('Organization deleted successfully');
      fetchOrganizations();
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete organization');
    }
  };

  const handleUpdateUser = async (userId: string, updates: { role?: UserRole; orgId?: string }) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      toast.success('User updated successfully');
      fetchOrganizations();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    handleUpdateUser(userId, { role: newRole });
  };

  const handleUpdateUserOrg = async (userId: string, newOrgId: string) => {
    handleUpdateUser(userId, { orgId: newOrgId });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Organizations</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>Add Organization</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="zip">ZIP</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {organizations.map((org) => (
          <Card key={org.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <Link
                    href={`/dashboard/organizations/${org.id}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {org.name}
                  </Link>
                  <CardDescription>
                    {[org.address, org.city, org.state, org.zip].filter(Boolean).join(', ')}
                  </CardDescription>
                </div>
                <div className="text-sm text-gray-500">
                  <div>{org._count.users} users</div>
                  <div>{org._count.referrals} referrals</div>
                  <div>{org._count.rewards} rewards</div>
                  <div>{org._count.programs} programs</div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOrg(org)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteOrg(org.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="users">
                <TabsList>
                  <TabsTrigger value="users">
                    Users ({org._count.users})
                  </TabsTrigger>
                  <TabsTrigger value="referrals">
                    Referrals ({org._count.referrals})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="users" className="mt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <h3 className="text-sm font-medium text-gray-500">Name/Email</h3>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Role</h3>
                      </div>
                    </div>
                    {org.users.map((user) => (
                      <div key={user.id} className="grid grid-cols-3 gap-4 py-2 border-b">
                        <div className="col-span-2">
                          <Link
                            href={`/dashboard/users/${user.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {user.name || 'No name'}
                          </Link>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                        <div>
                          <Badge variant={user.role === UserRole.ADMIN ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="referrals" className="mt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <h3 className="text-sm font-medium text-gray-500">Name/Email</h3>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Created</h3>
                      </div>
                    </div>
                    {org.referrals?.map((referral) => (
                      <div key={referral.id} className="grid grid-cols-4 gap-4 py-2 border-b">
                        <div className="col-span-2">
                          <Link
                            href={`/dashboard/referrals/${referral.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {referral.name}
                          </Link>
                          <div className="text-sm text-gray-500">{referral.email}</div>
                        </div>
                        <div>
                          <Badge
                            style={{
                              backgroundColor: referral.status.color,
                              color: 'white',
                            }}
                          >
                            {referral.status.name}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(referral.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    )) || <div className="text-gray-500">No referrals found</div>}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedOrg && (
        <Dialog open={!!selectedOrg} onOpenChange={(open) => !open && setSelectedOrg(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Organization</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="users">Users ({selectedOrg.users.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (selectedOrg) {
                      handleUpdateOrg(selectedOrg.id, formData);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-address">Address</Label>
                    <Input
                      id="edit-address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-city">City</Label>
                      <Input
                        id="edit-city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-state">State</Label>
                      <Input
                        id="edit-state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-zip">ZIP</Label>
                      <Input
                        id="edit-zip"
                        value={formData.zip}
                        onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setSelectedOrg(null)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <h3 className="text-sm font-medium text-gray-500">Name/Email</h3>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Role</h3>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Organization</h3>
                    </div>
                  </div>
                  {selectedOrg.users.map((user) => (
                    <div key={user.id} className="grid grid-cols-4 gap-4 py-2 border-b">
                      <div className="col-span-2">
                        <div className="font-medium">{user.name || 'No name'}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                      <div>
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateUserRole(user.id, e.target.value as UserRole)}
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                          disabled={user.email === session?.user?.email}
                        >
                          <option value={UserRole.CLIENT}>Client</option>
                          <option value={UserRole.ADMIN}>Admin</option>
                          <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                        </select>
                      </div>
                      <div>
                        <select
                          value={user.orgId}
                          onChange={(e) => handleUpdateUserOrg(user.id, e.target.value)}
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                          disabled={user.email === session?.user?.email}
                        >
                          {organizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <Button type="button" variant="outline" onClick={() => setSelectedOrg(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
