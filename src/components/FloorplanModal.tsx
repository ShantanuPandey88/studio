
"use client";

import * as React from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

type FloorplanModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export default function FloorplanModal({ isOpen, onOpenChange }: FloorplanModalProps) {
  const [scale, setScale] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const imageRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  const handleZoomIn = () => setScale(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.5));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX - position.x, 
      y: e.clientY - position.y 
    });
    if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (containerRef.current) {
        containerRef.current.style.cursor = 'grab';
    }
  };

   const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
       if (containerRef.current) {
          containerRef.current.style.cursor = 'grab';
      }
    }
  };


  React.useEffect(() => {
    // Reset on close
    if (!isOpen) {
      setTimeout(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }, 200); // delay to match dialog close animation
    }
  }, [isOpen]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">Office Floorplan</DialogTitle>
          <DialogDescription>
            Zoom and pan to view the desk layout.
          </DialogDescription>
        </DialogHeader>
        <div 
            ref={containerRef} 
            className="mt-4 flex-grow rounded-lg overflow-hidden border relative bg-muted/20"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div
            ref={imageRef}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            }}
            className="relative w-full h-full"
          >
            <Image
              src="/floorplan.png"
              alt="Office Floorplan"
              layout="fill"
              objectFit="contain"
              className="object-contain"
              data-ai-hint="office floorplan"
              draggable={false}
              unoptimized
            />
          </div>
        </div>
         <div className="absolute bottom-10 right-10 z-10 flex items-center gap-2">
            <Button size="icon" onClick={handleZoomIn} aria-label="Zoom In">
              <ZoomIn />
            </Button>
            <Button size="icon" onClick={handleZoomOut} aria-label="Zoom Out">
              <ZoomOut />
            </Button>
             <Button size="icon" onClick={handleReset} aria-label="Reset View">
              <RotateCcw />
            </Button>
          </div>
      </DialogContent>
    </Dialog>
  );
}
