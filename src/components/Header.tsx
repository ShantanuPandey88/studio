
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Map, Sparkles, Building2, Shield, LogOut, User as UserIcon } from "lucide-react";
import Link from 'next/link';
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";


type HeaderProps = {
  onOpenFloorplan: () => void;
  onOpenAiBooking: () => void;
  onOpenProfile: () => void;
};

export default function Header({ onOpenFloorplan, onOpenAiBooking, onOpenProfile }: HeaderProps) {
  const { user, claims, logout } = useAuth();
  
  const getInitials = (name?: string | null) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <>
      <header className="bg-card border-b shadow-sm sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-headline text-foreground tracking-tight">
              SeatServe
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onOpenFloorplan}>
                <Map />
                <span className="hidden md:inline ml-2">Floorplan</span>
              </Button>
              <Button onClick={onOpenAiBooking}>
                <Sparkles />
                <span className="hidden md:inline ml-2">AI Booking</span>
              </Button>
               {claims?.admin && (
                <Button variant="outline" asChild>
                  <Link href="/admin">
                    <Shield />
                    <span className="hidden md:inline ml-2">Admin</span>
                  </Link>
                </Button>
              )}
            </div>

             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onOpenProfile}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                   <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </header>
    </>
  );
}
