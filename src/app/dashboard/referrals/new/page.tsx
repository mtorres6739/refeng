'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface User {
  id: string;
  name: string | null;
  email: string;
}

export default function NewReferralPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTab, setSelectedTab] = useState<'existing' | 'new'>('existing');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    userId: session?.user?.id || '', // Default to current user
    recipientEmail: '', // For non-user recipients
  });

  useEffect(() => {
    // Fetch users from the organization
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      }
    };

    if (session?.user) {
      fetchUsers();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      toast.error("You must be logged in to create a referral");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the submission data
      const submissionData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        notes: formData.notes || null,
        // Only include recipientId if it's an existing user
        ...(selectedTab === 'existing' && formData.userId ? { recipientId: formData.userId } : {})
      };

      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create referral');
      }

      toast.success('Referral created successfully');
      router.push('/dashboard/referrals');
      router.refresh();
    } catch (error) {
      console.error('Error creating referral:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create referral');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!session) {
    return <div className="p-4">Please sign in to create referrals.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>New Referral</CardTitle>
          <CardDescription>Create a new referral</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipient Selection */}
            <div className="space-y-4">
              <Label>Send To</Label>
              <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'existing' | 'new')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="existing">Existing User</TabsTrigger>
                  <TabsTrigger value="new">New User</TabsTrigger>
                </TabsList>
                <TabsContent value="existing">
                  <Select
                    value={formData.userId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, userId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TabsContent>
                <TabsContent value="new">
                  <Input
                    type="email"
                    name="recipientEmail"
                    value={formData.recipientEmail}
                    onChange={handleChange}
                    placeholder="Enter email address"
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Referral Details */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Referral Name *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter the name of the person you're referring"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter their email address"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter their phone number (optional)"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add any additional notes about this referral"
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/referrals')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Referral"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
