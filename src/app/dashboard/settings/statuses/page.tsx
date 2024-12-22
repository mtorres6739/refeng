'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReferralStatus {
  id: string;
  name: string;
  color: string;
  description: string | null;
  order: number;
  isDefault: boolean;
  isSystem: boolean;
}

export default function StatusesPage() {
  const { data: session } = useSession();
  const [statuses, setStatuses] = useState<ReferralStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingStatus, setEditingStatus] = useState<ReferralStatus | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    color: '#94A3B8',
    description: '',
    isDefault: false,
  });

  const fetchStatuses = async () => {
    try {
      const res = await fetch('/api/settings/statuses');
      if (!res.ok) throw new Error('Failed to fetch statuses');
      const data = await res.json();
      setStatuses(data.sort((a: ReferralStatus, b: ReferralStatus) => a.order - b.order));
    } catch (error) {
      console.error('Error fetching statuses:', error);
      toast.error('Failed to load statuses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchStatuses();
    }
  }, [session]);

  const handleSubmit = async () => {
    try {
      const method = editingStatus ? 'PUT' : 'POST';
      const url = editingStatus 
        ? `/api/settings/statuses/${editingStatus.id}`
        : '/api/settings/statuses';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save status');

      await fetchStatuses();
      setIsDialogOpen(false);
      setEditingStatus(null);
      setFormData({
        name: '',
        color: '#94A3B8',
        description: '',
        isDefault: false,
      });
      toast.success(editingStatus ? 'Status updated' : 'Status created');
    } catch (error) {
      console.error('Error saving status:', error);
      toast.error('Failed to save status');
    }
  };

  const handleDelete = async (status: ReferralStatus) => {
    if (!confirm('Are you sure you want to delete this status? This will affect all referrals using this status.')) {
      return;
    }

    try {
      const res = await fetch(`/api/settings/statuses/${status.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete status');

      await fetchStatuses();
      toast.success('Status deleted');
    } catch (error) {
      console.error('Error deleting status:', error);
      toast.error('Failed to delete status');
    }
  };

  const handleEdit = (status: ReferralStatus) => {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      color: status.color,
      description: status.description || '',
      isDefault: status.isDefault,
    });
    setIsDialogOpen(true);
  };

  const handleReorder = async (draggedId: string, targetId: string) => {
    const draggedIndex = statuses.findIndex(s => s.id === draggedId);
    const targetIndex = statuses.findIndex(s => s.id === targetId);
    
    const newStatuses = [...statuses];
    const [draggedStatus] = newStatuses.splice(draggedIndex, 1);
    newStatuses.splice(targetIndex, 0, draggedStatus);

    // Update order numbers
    const updatedStatuses = newStatuses.map((status, index) => ({
      ...status,
      order: index,
    }));

    setStatuses(updatedStatuses);

    try {
      const res = await fetch('/api/settings/statuses/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          statusOrders: updatedStatuses.map(s => ({ 
            id: s.id, 
            order: s.order 
          }))
        }),
      });

      if (!res.ok) throw new Error('Failed to reorder statuses');
    } catch (error) {
      console.error('Error reordering statuses:', error);
      toast.error('Failed to save status order');
      // Revert to original order
      await fetchStatuses();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Loading statuses...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Referral Statuses</CardTitle>
              <CardDescription>
                Manage the statuses that can be assigned to referrals
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingStatus(null);
                    setFormData({
                      name: '',
                      color: '#94A3B8',
                      description: '',
                      isDefault: false,
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Status
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingStatus ? 'Edit Status' : 'Add Status'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingStatus 
                      ? 'Edit the details of this referral status'
                      : 'Create a new status for referrals'
                    }
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., In Progress"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-20"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe when this status should be used"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="isDefault">Set as default status for new referrals</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
                    {editingStatus ? 'Save Changes' : 'Create Status'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statuses.map((status) => (
              <div
                key={status.id}
                className="flex items-center justify-between p-4 bg-white border rounded-lg"
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', status.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const draggedId = e.dataTransfer.getData('text/plain');
                  if (draggedId !== status.id) {
                    handleReorder(draggedId, status.id);
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                  <Badge
                    style={{
                      backgroundColor: status.color,
                      color: '#ffffff',
                    }}
                  >
                    {status.name}
                  </Badge>
                  {status.isDefault && (
                    <Badge variant="outline">Default</Badge>
                  )}
                  {status.description && (
                    <span className="text-sm text-gray-500">
                      {status.description}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(status)}
                    disabled={status.isSystem}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(status)}
                    disabled={status.isSystem}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
