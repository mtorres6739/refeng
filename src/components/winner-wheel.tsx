'use client';

import React, { useRef, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';

interface WheelEntry {
  id: string;
  label: string;
  color: string;
}

interface LegendEntry {
  id: string;
  label: string;
  color: string;
  quantity: number;
}

interface WinnerWheelProps {
  entries: WheelEntry[];
  legendEntries: LegendEntry[];
  onSelectWinner: (winnerId: string) => void;
  onClose: () => void;
}

export function WinnerWheel({ entries, legendEntries, onSelectWinner, onClose }: WinnerWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [showWinnerOverlay, setShowWinnerOverlay] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    const sliceAngle = (2 * Math.PI) / entries.length;
    let currentAngle = 0;

    // Draw wheel segments
    entries.forEach((entry) => {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();

      ctx.fillStyle = entry.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(currentAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.fillText(entry.label, radius - 20, 5);
      ctx.restore();

      currentAngle += sliceAngle;
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [entries]);

  const spinWheel = () => {
    if (isSpinning || entries.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSpinning(true);
    setShowWinnerOverlay(false);
    setSelectedWinner(null);

    const targetRotation = Math.random() * Math.PI * 2; // Random final position
    const totalSpins = 5 + Math.random() * 3; // 5-8 full spins
    const spinDuration = 5000; // 5 seconds
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRotation = (totalSpins * Math.PI * 2 + targetRotation) * easeOut;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(currentRotation);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // Redraw wheel
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 10;
      const sliceAngle = (2 * Math.PI) / entries.length;
      let currentAngle = 0;

      entries.forEach((entry) => {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();

        ctx.fillStyle = entry.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(currentAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.fillText(entry.label, radius - 20, 5);
        ctx.restore();

        currentAngle += sliceAngle;
      });

      ctx.restore();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Calculate winner
        const normalizedRotation = (2 * Math.PI - (currentRotation % (2 * Math.PI))) % (2 * Math.PI);
        const sliceAngle = (2 * Math.PI) / entries.length;
        const winningIndex = Math.floor(normalizedRotation / sliceAngle);
        console.log('Winning calculation:', {
          normalizedRotation,
          sliceAngle,
          winningIndex,
          totalEntries: entries.length,
          selectedEntry: entries[winningIndex]
        });
        
        const winner = entries[winningIndex];
        
        setIsSpinning(false);
        if (winner) {
          setSelectedWinner(winner.id);
          
          // Show winner overlay with a slight delay and trigger celebration
          setTimeout(() => {
            setShowWinnerOverlay(true);
            triggerWinnerCelebration();
          }, 500);
        }
      }
    };

    requestAnimationFrame(animate);
  };

  const triggerWinnerCelebration = () => {
    const fireworks = () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    };

    // Initial burst
    fireworks();

    // Secondary bursts
    setTimeout(() => {
      fireworks();
    }, 500);

    setTimeout(() => {
      fireworks();
    }, 1000);
  };

  const handleConfirmWinner = () => {
    if (selectedWinner) {
      onSelectWinner(selectedWinner);
      onClose();
    }
  };

  return (
    <div className="flex space-x-8">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="border rounded-full shadow-lg"
          />
          {showWinnerOverlay && selectedWinner && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/80 p-8 rounded-xl text-center transform animate-scale-up">
                <h3 className="text-2xl font-bold text-white mb-4">
                  🎉 Winner Selected! 🎉
                </h3>
                <p className="text-lg text-white mb-6">
                  {entries.find(e => e.id === selectedWinner)?.label}
                </p>
                <Button 
                  onClick={handleConfirmWinner}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  Confirm Winner
                </Button>
              </div>
            </div>
          )}
          <Button
            className="mt-4 bg-green-500 hover:bg-green-600 text-white text-lg px-8 py-6 rounded-full shadow-lg transform transition-all hover:scale-105"
            onClick={spinWheel}
            disabled={isSpinning || entries.length === 0}
          >
            {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
          </Button>
        </div>
      </div>

      <div className="w-64 bg-white rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-bold mb-4">Entry Distribution</h3>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {legendEntries.map((entry) => (
            <div 
              key={entry.id} 
              className="flex items-center justify-between p-2 rounded bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <p className="font-medium truncate" title={entry.label}>
                  {entry.label}
                </p>
              </div>
              <span className="ml-2 font-bold text-primary">
                {entry.quantity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
