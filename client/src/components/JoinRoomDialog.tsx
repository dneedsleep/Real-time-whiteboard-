import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface JoinRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JoinRoomDialog = ({ open, onOpenChange }: JoinRoomDialogProps) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const handleJoinRoom = () => {
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username",
        variant: "destructive",
      });
      return;
    }
    if (!roomCode.trim()) {
      toast({
        title: "Room code required",
        description: "Please enter a room code",
        variant: "destructive",
      });
      return;
    }
    
    // Store username in session storage
    sessionStorage.setItem('username', username);
    
    // Navigate to the room
    navigate(`/room/${roomCode}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Join a Room</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter the room code shared with you to join
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="join-username" className="text-foreground">Your Username</Label>
            <Input
              id="join-username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="room-code" className="text-foreground">Room Code</Label>
            <Input
              id="room-code"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground font-mono"
              maxLength={6}
            />
          </div>

          <Button 
            onClick={handleJoinRoom}
            className="w-full bg-gradient-to-r from-secondary to-accent hover:opacity-90 text-secondary-foreground font-semibold"
          >
            Join Room
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
