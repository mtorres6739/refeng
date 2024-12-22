'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { UserRole } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Organization {
  id: string;
  name: string;
}

export default function CreateUser() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    orgId: '',
  });

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await fetch('/api/organizations');
        if (!res.ok) throw new Error('Failed to fetch organizations');
        const data = await res.json();
        setOrganizations(data);
      } catch (error) {
        console.error('Error fetching organizations:', error);
        toast.error('Failed to load organizations');
      }
    };

    if (session?.user?.role === UserRole.SUPER_ADMIN) {
      fetchOrganizations();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create user');
      }

      toast.success('User created successfully');
      router.push('/dashboard/users');
      router.refresh();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | { name: string; value: string }
  ) => {
    const { name, value } = 'target' in e ? e.target : e;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                name="role"
                value={formData.role}
                onValueChange={(value) => handleChange({ name: 'role', value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  {session?.user?.role === UserRole.SUPER_ADMIN && (
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {session?.user?.role === UserRole.SUPER_ADMIN && (
              <div>
                <Label htmlFor="organization">Organization</Label>
                <Select
                  name="orgId"
                  value={formData.orgId}
                  onValueChange={(value) => handleChange({ name: 'orgId', value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create User'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
