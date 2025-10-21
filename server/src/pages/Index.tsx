import { useState } from "react";
import { Plus, LogIn } from "lucide-react";
import { RoomCard } from "@/components/RoomCard";
import { CreateRoomDialog } from "@/components/CreateRoomDialog";
import { JoinRoomDialog } from "@/components/JoinRoomDialog";

const Index = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 text-center mb-12 animate-fade-in">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Welcome to Rooms
        </h1>
        <p className="text-xl text-muted-foreground">
          Create or join a room to get started
        </p>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-center w-full max-w-5xl">
        <RoomCard
          title="Create Room"
          description="Start a new room and invite others to join with a unique code"
          icon={<Plus className="w-8 h-8" />}
          onClick={() => setCreateDialogOpen(true)}
          variant="primary"
        />

        <RoomCard
          title="Join Room"
          description="Enter a room code to join an existing room and connect with others"
          icon={<LogIn className="w-8 h-8" />}
          onClick={() => setJoinDialogOpen(true)}
          variant="secondary"
        />
      </div>

      <CreateRoomDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <JoinRoomDialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen} />
    </div>
  );
};

export default Index;
