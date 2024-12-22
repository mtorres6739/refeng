import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface PointsAwardProps {
  referralId: string;
  currentPoints: number;
  onPointsAwarded: (points: number) => void;
  disabled?: boolean;
}

export function PointsAward({ referralId, currentPoints, onPointsAwarded, disabled }: PointsAwardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [points, setPoints] = useState(currentPoints.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setError(null);
      setIsSubmitting(true);

      const pointsNum = parseInt(points, 10);
      if (isNaN(pointsNum) || pointsNum < 0) {
        setError("Please enter a valid number of points (0 or greater)");
        return;
      }

      const response = await fetch(`/api/referrals/${referralId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pointsAwarded: pointsNum,
          note: `Awarded ${pointsNum} points`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to award points');
      }

      const data = await response.json();
      onPointsAwarded(pointsNum);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to award points');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          disabled={disabled}
          className="w-full sm:w-auto"
        >
          Award Points
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Award Points</DialogTitle>
          <DialogDescription>
            Enter the total number of points to award for this referral.
            This will update both the referral and the referrer's points.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="points" className="text-right">
              Points
            </Label>
            <Input
              id="points"
              type="number"
              min="0"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="col-span-3"
              placeholder="Enter points to award"
            />
          </div>
          {error && (
            <div className="text-sm text-red-500 col-span-4 text-center">
              {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Awarding Points...
              </>
            ) : (
              'Award Points'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
