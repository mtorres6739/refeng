'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserSearch } from "@/components/user-search";
import { WinnerWheel } from "@/components/winner-wheel";
import { DrawingStatus, DrawingEntryType } from '@prisma/client';

interface Drawing {
  id: string;
  name: string;
  description: string | null;
  prize: string;
  prizeDetails: string | null;
  startDate: string;
  endDate: string;
  drawDate: string;
  status: DrawingStatus;
  rules: string | null;
  minEntries: number;
  maxEntries: number | null;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  createdById: string;
  organization: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  entries: DrawingEntry[];
  DrawingEntry_Drawing_winnerIdToDrawingEntry: {
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  } | null;
}

interface DrawingEntry {
  id: string;
  drawingId: string;
  userId: string;
  entryType: DrawingEntryType;
  quantity: number;
  referenceId: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

export default function DrawingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = new URLSearchParams(window.location.search);
  const action = searchParams.get('action');

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/signin');
    },
  });

  const [drawing, setDrawing] = useState<Drawing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [entryQuantity, setEntryQuantity] = useState(1);
  const [isWinnerDialogOpen, setIsWinnerDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    prize: '',
    prizeDetails: '',
    startDate: '',
    endDate: '',
    drawDate: '',
    rules: '',
    minEntries: 1,
    maxEntries: null as number | null,
  });

  const fetchDrawing = async () => {
    try {
      const response = await fetch(`/api/drawings/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch drawing');
      const data = await response.json();
      setDrawing(data);
    } catch (error) {
      console.error('Error fetching drawing:', error);
      setError('Failed to fetch drawing');
    } finally {
      setIsLoading(false);
    }
  };

  const updateDrawingStatus = async (newStatus: DrawingStatus) => {
    try {
      const response = await fetch(`/api/drawings/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update drawing status');
      await fetchDrawing();
      toast.success(`Drawing status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating drawing status:', error);
      toast.error('Failed to update drawing status');
    }
  };

  const selectWinner = async (winnerId: string) => {
    try {
      console.log('Selecting winner with ID:', winnerId);
      const response = await fetch(`/api/drawings/${params.id}/select-winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error response:', error);
        throw new Error(error.error || 'Failed to select winner');
      }

      const data = await response.json();
      console.log('Winner selected:', data);
      
      await fetchDrawing();
      toast.success(`Winner selected: ${data.winner?.name || data.winner?.email}`);
    } catch (error: any) {
      console.error('Error selecting winner:', error);
      toast.error(error.message || 'Failed to select winner');
      throw error;
    }
  };

  const addManualEntry = async () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    const payload = {
      userId: selectedUser.id,
      quantity: entryQuantity || 1,
    };
    console.log('Adding manual entry with payload:', payload);

    try {
      const response = await fetch(`/api/drawings/${params.id}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Response from server:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add entry');
      }
      
      await fetchDrawing();
      setIsAddEntryOpen(false);
      setSelectedUser(null);
      setEntryQuantity(1);
      toast.success('Entry added successfully');
    } catch (error) {
      console.error('Error adding entry:', error);
      toast.error(error.message || 'Failed to add entry');
    }
  };

  const resetDrawing = async () => {
    try {
      const response = await fetch(`/api/drawings/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: DrawingStatus.DRAFT,
          DrawingEntry_Drawing_winnerIdToDrawingEntry: null,
        }),
      });

      if (!response.ok) throw new Error('Failed to reset drawing');
      await fetchDrawing();
      toast.success('Drawing has been reset');
    } catch (error) {
      console.error('Error resetting drawing:', error);
      toast.error('Failed to reset drawing');
    }
  };

  const deleteDrawing = async () => {
    try {
      const response = await fetch(`/api/drawings/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete drawing');
      toast.success('Drawing deleted successfully');
      router.push('/dashboard/drawings');
    } catch (error) {
      console.error('Error deleting drawing:', error);
      toast.error('Failed to delete drawing');
    }
  };

  const updateDrawing = async () => {
    try {
      const response = await fetch(`/api/drawings/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error('Failed to update drawing');
      await fetchDrawing();
      setIsEditOpen(false);
      toast.success('Drawing updated successfully');
    } catch (error) {
      console.error('Error updating drawing:', error);
      toast.error('Failed to update drawing');
    }
  };

  useEffect(() => {
    if (session) {
      fetchDrawing();
    }
  }, [session]);

  useEffect(() => {
    if (drawing) {
      setEditForm({
        name: drawing.name,
        description: drawing.description || '',
        prize: drawing.prize,
        prizeDetails: drawing.prizeDetails || '',
        startDate: format(new Date(drawing.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(drawing.endDate), 'yyyy-MM-dd'),
        drawDate: format(new Date(drawing.drawDate), 'yyyy-MM-dd'),
        rules: drawing.rules || '',
        minEntries: drawing.minEntries,
        maxEntries: drawing.maxEntries,
      });
    }
  }, [drawing]);

  useEffect(() => {
    if (action === 'select-winner' && drawing?.status === DrawingStatus.ACTIVE) {
      setIsWinnerDialogOpen(true);
    }
  }, [action, drawing?.status]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!drawing) return <div>Drawing not found</div>;

  const getStatusColor = (status: DrawingStatus) => {
    switch (status) {
      case DrawingStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case DrawingStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case DrawingStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800';
      case DrawingStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{drawing.name}</CardTitle>
              <Badge className={getStatusColor(drawing.status)}>{drawing.status}</Badge>
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditOpen(true)}
              >
                Edit Drawing
              </Button>

              {/* Edit Dialog */}
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Edit Drawing</DialogTitle>
                    <DialogDescription>
                      Update the drawing details. Click save when you're done.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <textarea
                        id="description"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="prize">Prize</Label>
                      <Input
                        id="prize"
                        value={editForm.prize}
                        onChange={(e) => setEditForm({ ...editForm, prize: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="prizeDetails">Prize Details</Label>
                      <textarea
                        id="prizeDetails"
                        value={editForm.prizeDetails}
                        onChange={(e) => setEditForm({ ...editForm, prizeDetails: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={editForm.startDate}
                          onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={editForm.endDate}
                          onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="drawDate">Draw Date</Label>
                        <Input
                          id="drawDate"
                          type="date"
                          value={editForm.drawDate}
                          onChange={(e) => setEditForm({ ...editForm, drawDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="rules">Rules</Label>
                      <textarea
                        id="rules"
                        value={editForm.rules}
                        onChange={(e) => setEditForm({ ...editForm, rules: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="minEntries">Minimum Entries</Label>
                        <Input
                          id="minEntries"
                          type="number"
                          min={1}
                          value={editForm.minEntries}
                          onChange={(e) => setEditForm({ ...editForm, minEntries: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="maxEntries">Maximum Entries</Label>
                        <Input
                          id="maxEntries"
                          type="number"
                          min={1}
                          value={editForm.maxEntries || ''}
                          onChange={(e) => setEditForm({ 
                            ...editForm, 
                            maxEntries: e.target.value ? parseInt(e.target.value) : null 
                          })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={updateDrawing}>Save Changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Drawing</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Drawing</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the drawing and all its entries. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={deleteDrawing}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {drawing.status === DrawingStatus.DRAFT && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">Activate Drawing</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Activate Drawing</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to activate this drawing? This will allow users to start entering.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => updateDrawingStatus(DrawingStatus.ACTIVE)}>
                        Activate
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              
              {drawing.status === DrawingStatus.ACTIVE && (
                <>
                  <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Add Entry</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Manual Entry</DialogTitle>
                        <DialogDescription>
                          Add entries for a user manually. Each user can have multiple entries.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Select User</Label>
                          <UserSearch 
                            onSelect={setSelectedUser} 
                            selectedUser={selectedUser}
                          />
                        </div>
                        {selectedUser && (
                          <div className="space-y-2">
                            <Label>Number of Entries</Label>
                            <Input
                              type="number"
                              min={1}
                              max={drawing.maxEntries || undefined}
                              value={entryQuantity}
                              onChange={(e) => setEntryQuantity(parseInt(e.target.value))}
                            />
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setIsAddEntryOpen(false);
                          setSelectedUser(null);
                          setEntryQuantity(1);
                        }}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={addManualEntry}
                          disabled={!selectedUser || entryQuantity < 1}
                        >
                          Add Entry
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isWinnerDialogOpen} onOpenChange={setIsWinnerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>Select Winner</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[900px]">
                      <DialogHeader>
                        <DialogTitle>Select Winner</DialogTitle>
                        <DialogDescription>
                          Spin the wheel to randomly select a winner from all entries!
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <WinnerWheel
                          entries={drawing.entries.flatMap((entry) => {
                            const quantity = typeof entry.quantity === 'number' ? entry.quantity : 1;
                            return Array(quantity).fill({
                              id: entry.id,
                              label: entry.user.name || entry.user.email,
                              color: `hsl(${Object.keys(
                                drawing.entries.reduce((acc, e) => ({ ...acc, [e.user.id]: true }), {})
                              ).indexOf(entry.user.id) * 45}, 70%, 50%)`,
                            });
                          })}
                          legendEntries={Object.values(
                            drawing.entries.reduce((acc, entry) => {
                              const key = entry.user.id;
                              const quantity = typeof entry.quantity === 'number' ? entry.quantity : 1;
                              
                              if (!acc[key]) {
                                acc[key] = {
                                  id: entry.id,
                                  label: entry.user.name || entry.user.email,
                                  color: `hsl(${Object.keys(acc).length * 45}, 70%, 50%)`,
                                  quantity,
                                };
                              } else {
                                acc[key].quantity += quantity;
                              }
                              return acc;
                            }, {} as Record<string, { 
                              id: string; 
                              label: string; 
                              color: string; 
                              quantity: number;
                            }>)
                          )}
                          onSelectWinner={async (winnerId) => {
                            await selectWinner(winnerId);
                            setIsWinnerDialogOpen(false);
                          }}
                          onClose={() => setIsWinnerDialogOpen(false)}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
              {drawing.status === DrawingStatus.COMPLETED && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">Reset Drawing</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Drawing</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reset the drawing to draft status and remove the winner. Are you sure?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={resetDrawing}>
                        Reset Drawing
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Prize</h3>
              <p>{drawing.prize}</p>
              {drawing.prizeDetails && (
                <p className="text-sm text-gray-500">{drawing.prizeDetails}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium">Start Date</h4>
                <p>{format(new Date(drawing.startDate), 'PPP')}</p>
              </div>
              <div>
                <h4 className="font-medium">End Date</h4>
                <p>{format(new Date(drawing.endDate), 'PPP')}</p>
              </div>
              <div>
                <h4 className="font-medium">Draw Date</h4>
                <p>{format(new Date(drawing.drawDate), 'PPP')}</p>
              </div>
            </div>

            {drawing.rules && (
              <div>
                <h3 className="text-lg font-medium">Rules</h3>
                <p>{drawing.rules}</p>
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium">Entries</h3>
              <p>Minimum entries required: {drawing.minEntries}</p>
              {drawing.maxEntries && <p>Maximum entries allowed: {drawing.maxEntries}</p>}
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Current Entries</h4>
                {drawing.entries.length === 0 ? (
                  <p className="text-gray-500">No entries yet</p>
                ) : (
                  <div className="border rounded-lg divide-y">
                    {Object.values(
                      drawing.entries.reduce((acc, entry) => {
                        const key = entry.user.id;
                        const quantity = typeof entry.quantity === 'number' ? entry.quantity : 1;
                        
                        if (!acc[key]) {
                          acc[key] = {
                            id: entry.id,
                            user: entry.user,
                            totalQuantity: quantity,
                            createdAt: entry.createdAt,
                          };
                        } else {
                          acc[key].totalQuantity += quantity;
                        }
                        return acc;
                      }, {} as Record<string, { 
                        id: string; 
                        user: { id: string; name: string | null; email: string; }; 
                        totalQuantity: number;
                        createdAt: string;
                      }>)
                    ).map((entry) => (
                      <div key={entry.id} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{entry.user.name || entry.user.email}</p>
                          <p className="text-sm text-gray-500">
                            Total entries: {entry.totalQuantity}
                          </p>
                        </div>
                        <Badge variant="secondary">{entry.totalQuantity} entries</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {drawing.DrawingEntry_Drawing_winnerIdToDrawingEntry && (
              <div>
                <h3 className="text-lg font-medium">Winner</h3>
                <p>{drawing.DrawingEntry_Drawing_winnerIdToDrawingEntry.user.name || drawing.DrawingEntry_Drawing_winnerIdToDrawingEntry.user.email}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
