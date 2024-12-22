'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { UserRole } from '@prisma/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from 'date-fns';
import { PointsAward } from './PointsAward';
import { NoteItem } from './NoteItem';
import { Pencil, X, Check } from 'lucide-react';
import Link from 'next/link';

interface Note {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  user: {
    id: string;
    name: string;
  };
  userId: string;
}

interface ReferralProgram {
  id: string;
  name: string;
  description?: string;
  pointsValue: number;
}

interface ReferralStatus {
  id: string;
  name: string;
  color: string;
  description?: string;
  order: number;
  isDefault: boolean;
  isSystem: boolean;
}

interface Referral {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: ReferralStatus;
  statusId: string;
  pointsAwarded: number;
  createdAt: Date;
  convertedAt: Date | null;
  notes: Note[];
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  organization: {
    id: string;
    name: string;
  };
}

export default function ReferralProfile({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [statuses, setStatuses] = useState<ReferralStatus[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedReferral, setEditedReferral] = useState<{
    name: string;
    email: string;
    phone: string;
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
    orgId: string;
    organization: {
      id: string;
      name: string;
    };
  } | null>(null);

  const fetchReferral = async () => {
    try {
      console.log('Fetching referral:', params.id);
      const res = await fetch(`/api/referrals/${params.id}`);
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        const error = await res.json();
        console.error('Failed to fetch referral:', error);
        
        if (res.status === 404) {
          toast.error('Referral not found');
          router.push('/dashboard/referrals');
          return;
        }
        
        if (res.status === 401) {
          toast.error('Please sign in to view this referral');
          return;
        }
        
        if (res.status === 403) {
          toast.error('You do not have permission to view this referral');
          router.push('/dashboard/referrals');
          return;
        }
        
        throw new Error(error.error || error.message || 'Failed to fetch referral');
      }

      const data = await res.json();
      console.log('Fetched referral:', data);
      setReferral(data);
    } catch (error) {
      console.error('Failed to fetch referral:', error);
      toast.error('Failed to load referral details. Please try again later.');
    }
  };

  const fetchCurrentUser = async () => {
    if (!session?.user?.email) return;

    try {
      const res = await fetch(`/api/users/me`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch user details');
      }

      const data = await res.json();
      setCurrentUser(data);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      toast.error(error.error || error.message || 'Failed to fetch user details');
    }
  };

  const fetchStatuses = async () => {
    try {
      console.log('Fetching referral statuses...');
      const res = await fetch('/api/referral-statuses');
      console.log('Referral statuses response status:', res.status);
      if (!res.ok) throw new Error('Failed to fetch statuses');
      const data = await res.json();
      console.log('Fetched referral statuses:', data);
      setStatuses(data);
    } catch (error) {
      console.error('Error fetching statuses:', error);
      toast.error('Failed to load statuses');
    }
  };

  useEffect(() => {
    if (session) {
      fetchReferral();
      fetchCurrentUser();
      fetchStatuses();
    }
  }, [session, params.id]);

  const handleStatusChange = async (newStatus: { id: string; name: string }) => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/referrals/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statusId: newStatus.id,
          note: `Status changed to ${newStatus.name}`,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error('Error response:', error);
        throw new Error(error.details || error.error || error.message || 'Failed to update status');
      }

      const data = await res.json();
      setReferral(data);
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!editedReferral) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/referrals/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedReferral),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error('Failed to update referral:', error);
        throw new Error(error.error || error.message || 'Failed to update referral');
      }

      const data = await res.json();
      setReferral(data);
      setIsEditing(false);
      toast.success('Referral details updated successfully');
    } catch (error) {
      console.error('Failed to update referral:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update referral');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/referrals/${params.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newNote,
          isInternal: isInternalNote,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error('Failed to add note:', error);
        throw new Error(error.error || error.message || 'Failed to add note');
      }

      await fetchReferral();
      setNewNote('');
      setIsInternalNote(false);
      toast.success('Note added successfully');
    } catch (error) {
      console.error('Failed to add note:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePointsAwarded = (points: number) => {
    if (referral) {
      setReferral({
        ...referral,
        pointsAwarded: points,
        user: {
          ...referral.user,
          points: referral.user.points + (points - referral.pointsAwarded),
          totalEarned: referral.user.totalEarned + (points - referral.pointsAwarded),
        },
      });
      toast.success('Points awarded successfully');
    }
  };

  useEffect(() => {
    if (referral && !editedReferral) {
      setEditedReferral({
        name: referral.name,
        email: referral.email,
        phone: referral.phone || '',
      });
    }
  }, [referral]);

  if (!referral || !currentUser || !editedReferral) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Loading referral details...</h2>
        </div>
      </div>
    );
  }

  const isOrgMember = currentUser.orgId === referral.organization.id;
  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editedReferral.name}
                      onChange={(e) => setEditedReferral({ ...editedReferral, name: e.target.value })}
                      className="max-w-md"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={editedReferral.email}
                      onChange={(e) => setEditedReferral({ ...editedReferral, email: e.target.value })}
                      className="max-w-md"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editedReferral.phone}
                      onChange={(e) => setEditedReferral({ ...editedReferral, phone: e.target.value })}
                      className="max-w-md"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-2xl font-bold">{referral.name}</h2>
                  <Badge variant={referral.status.name === 'Converted' ? 'default' : 'secondary'} style={{ backgroundColor: referral.status.color }}>
                    {referral.status.name}
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedReferral({
                        name: referral.name,
                        email: referral.email,
                        phone: referral.phone || '',
                      });
                    }}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveDetails}
                    disabled={isSubmitting}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  disabled={isSubmitting}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Referral Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{referral.email}</p>
                </div>
                {referral.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{referral.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Organization</p>
                  <p className="font-medium">{referral.organization.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Referred By</p>
                  <Link 
                    href={`/dashboard/users/${referral.user.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {referral.user.name || referral.user.email}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{formatDistanceToNow(new Date(referral.createdAt))} ago</p>
                </div>
                {referral.convertedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Converted</p>
                    <p className="font-medium">{formatDistanceToNow(new Date(referral.convertedAt))} ago</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Referrer Points</p>
                  <p className="font-medium">{referral.user.points} <span className="text-sm text-gray-500">(Total: {referral.user.totalEarned})</span></p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Points Awarded</p>
                  <p className="font-medium">{referral.pointsAwarded}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Actions</h3>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Update Status</p>
                  <Select
                    value={referral.statusId}
                    onValueChange={(value: string) => {
                      const status = statuses.find(s => s.id === value);
                      if (status) {
                        handleStatusChange(status);
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue>
                        {referral.status.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem 
                          key={status.id} 
                          value={status.id}
                          className="flex items-center gap-2"
                        >
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Award Points</p>
                  <PointsAward
                    referralId={referral.id}
                    currentPoints={referral.pointsAwarded}
                    onPointsAwarded={handlePointsAwarded}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Notes</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Internal Note</span>
                    </label>
                    <Button 
                      onClick={handleAddNote} 
                      disabled={isSubmitting || !newNote.trim()}
                    >
                      Add Note
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  {referral.notes.map((note) => (
                    <NoteItem
                      key={note.id}
                      note={note}
                      referralId={referral.id}
                      currentUserId={currentUser.id}
                      isOrgMember={isOrgMember}
                      isSuperAdmin={isSuperAdmin}
                      onNoteUpdated={fetchReferral}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
