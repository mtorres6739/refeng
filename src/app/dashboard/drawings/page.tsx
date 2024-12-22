'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { DrawingStatus, DrawingEntryType } from '@prisma/client';
import Link from 'next/link';

interface DrawingEntry {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  entryType: DrawingEntryType;
  quantity: number;
  createdAt: string;
}

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
  winnerId: string | null;
  rules: string | null;
  minEntries: number;
  maxEntries: number | null;
  entries: DrawingEntry[];
  DrawingEntry_Drawing_winnerIdToDrawingEntry: {
    user: {
      name: string;
      email: string;
    };
  } | null;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function DrawingsPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/signin');
    },
  });

  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prize: '',
    prizeDetails: '',
    startDate: new Date(),
    endDate: new Date(),
    drawDate: new Date(),
    rules: '',
    minEntries: 1,
    maxEntries: null as number | null,
  });

  const fetchDrawings = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('Fetching drawings - session:', {
        status,
        user: session?.user
      });
      
      const response = await fetch('/api/drawings');
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to fetch drawings:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          details: data.details
        });
        throw new Error(data.error || 'Failed to fetch drawings');
      }
      
      setDrawings(data);
    } catch (error: any) {
      console.error('Error in fetchDrawings:', {
        message: error.message,
        cause: error.cause,
        stack: error.stack
      });
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.orgId) {
      fetchDrawings();
    }
  }, [status, session]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.name || !formData.prize || !formData.startDate || !formData.endDate || !formData.drawDate) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate dates
      if (formData.endDate < formData.startDate) {
        toast.error('End date must be after start date');
        return;
      }
      if (formData.drawDate < formData.endDate) {
        toast.error('Draw date must be after end date');
        return;
      }

      const response = await fetch('/api/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate.toISOString(),
          endDate: formData.endDate.toISOString(),
          drawDate: formData.drawDate.toISOString(),
          minEntries: parseInt(formData.minEntries.toString()),
          maxEntries: formData.maxEntries ? parseInt(formData.maxEntries.toString()) : null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create drawing');

      await fetchDrawings();
      setIsModalOpen(false);
      setFormData({
        name: '',
        description: '',
        prize: '',
        prizeDetails: '',
        startDate: new Date(),
        endDate: new Date(),
        drawDate: new Date(),
        rules: '',
        minEntries: 1,
        maxEntries: null,
      });
      toast.success('Drawing created successfully');
    } catch (error: any) {
      console.error('Error creating drawing:', error);
      toast.error(error.message || 'Failed to create drawing');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const canManageDrawings = session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMIN';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Prize Drawings</h1>
        {canManageDrawings && (
          <Button onClick={() => setIsModalOpen(true)}>
            Create Drawing
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {drawings.map((drawing) => (
          <Card key={drawing.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>
                    <Link href={`/dashboard/drawings/${drawing.id}`} className="hover:text-primary">
                      {drawing.name}
                    </Link>
                  </CardTitle>
                  <CardDescription>{drawing.description}</CardDescription>
                </div>
                <Badge variant={
                  drawing.status === 'DRAFT' ? 'secondary' :
                  drawing.status === 'ACTIVE' ? 'default' :
                  drawing.status === 'IN_PROGRESS' ? 'warning' :
                  drawing.status === 'COMPLETED' ? 'success' :
                  'destructive'
                }>
                  {drawing.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Prize</h4>
                  <p>{drawing.prize}</p>
                  {drawing.prizeDetails && (
                    <p className="text-sm text-gray-500">{drawing.prizeDetails}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Start Date</p>
                    <p>{format(new Date(drawing.startDate), 'PPP')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">End Date</p>
                    <p>{format(new Date(drawing.endDate), 'PPP')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Draw Date</p>
                    <p>{format(new Date(drawing.drawDate), 'PPP')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Entries</p>
                    <p>{drawing.entries.length} / {drawing.minEntries} min</p>
                  </div>
                </div>
                {drawing.DrawingEntry_Drawing_winnerIdToDrawingEntry && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800">Winner</h4>
                    <p className="text-green-700">{drawing.DrawingEntry_Drawing_winnerIdToDrawingEntry.user.name || drawing.DrawingEntry_Drawing_winnerIdToDrawingEntry.user.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-4 justify-end pt-6">
              {canManageDrawings && drawing.status === 'ACTIVE' && (
                <Button
                  variant="secondary"
                  className="min-w-[120px]"
                  asChild
                >
                  <Link href={`/dashboard/drawings/${drawing.id}`}>
                    Manage Entries
                  </Link>
                </Button>
              )}
              {drawing.status === 'ACTIVE' && drawing.entries.length >= drawing.minEntries && (
                <Button
                  className="min-w-[120px]"
                  asChild
                >
                  <Link href={`/dashboard/drawings/${drawing.id}?action=select-winner`}>
                    Draw Winner
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Create Drawing Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Drawing</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new prize drawing.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prize">Prize</Label>
                <Input
                  id="prize"
                  value={formData.prize}
                  onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prizeDetails">Prize Details</Label>
                <Textarea
                  id="prizeDetails"
                  value={formData.prizeDetails || ''}
                  onChange={(e) => setFormData({ ...formData, prizeDetails: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !formData.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? format(formData.startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !formData.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(formData.endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => date && setFormData({ ...formData, endDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Draw Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !formData.drawDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.drawDate ? format(formData.drawDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.drawDate}
                        onSelect={(date) => date && setFormData({ ...formData, drawDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rules">Rules</Label>
                <Textarea
                  id="rules"
                  value={formData.rules || ''}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minEntries">Minimum Entries</Label>
                  <Input
                    id="minEntries"
                    type="number"
                    min={1}
                    value={formData.minEntries}
                    onChange={(e) => setFormData({ ...formData, minEntries: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxEntries">Maximum Entries</Label>
                  <Input
                    id="maxEntries"
                    type="number"
                    min={1}
                    value={formData.maxEntries || ''}
                    onChange={(e) => setFormData({ ...formData, maxEntries: e.target.value ? parseInt(e.target.value) : null })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Drawing</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
