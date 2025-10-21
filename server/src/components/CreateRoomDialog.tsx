import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateRoomDialog = ({ open, onOpenChange }: CreateRoomDialogProps) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [copied, setCopied] = useState(false);

  const generateRoomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    toast({
      title: "Room created!",
      description: `Your room code is ${code}`,
    });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Room code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinRoom = () => {
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username",
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
          <DialogTitle className="text-2xl font-bold text-foreground">Create a Room</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Generate a room code and share it with others to join
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-foreground">Your Username</Label>
            <Input
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {!roomCode ? (
            <Button 
              onClick={generateRoomCode}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground font-semibold"
            >
              Generate Room Code
            </Button>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-foreground">Room Code</Label>
                <div className="flex gap-2">
                  <Input
                    value={roomCode}
                    readOnly
                    className="bg-input border-border text-foreground font-mono text-lg font-bold"
                  />
                  <Button
                    size="icon"
                    onClick={copyRoomCode}
                    variant="outline"
                    className="border-border hover:bg-accent"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handleJoinRoom}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground font-semibold"
              >
                Join Room
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
