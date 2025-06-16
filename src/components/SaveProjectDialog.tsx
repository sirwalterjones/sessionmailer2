"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Sparkles, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SaveProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export default function SaveProjectDialog({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
  error
}: SaveProjectDialogProps) {
  const [projectName, setProjectName] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSave = async () => {
    if (!projectName.trim()) {
      setLocalError("Please enter a project name");
      return;
    }

    if (projectName.length < 3) {
      setLocalError("Project name must be at least 3 characters");
      return;
    }

    if (projectName.length > 50) {
      setLocalError("Project name must be less than 50 characters");
      return;
    }

    setLocalError("");
    await onSave(projectName.trim());
  };

  const handleClose = () => {
    setProjectName("");
    setLocalError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
        <DialogHeader className="text-center pb-6">
          <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg w-fit">
            <Save className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Save Your Project
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base">
            Give your beautiful email template a memorable name so you can find it later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="projectName" className="text-sm font-semibold text-gray-700">
              Project Name
            </Label>
            <div className="relative">
              <Input
                id="projectName"
                placeholder="e.g., Summer Portrait Session Email"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="h-12 pl-12 border-2 border-gray-200 focus:border-purple-400 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                disabled={isLoading}
                maxLength={50}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleSave();
                  }
                }}
              />
              <Sparkles className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Choose a descriptive name for easy identification
              </p>
              <p className="text-xs text-gray-400">
                {projectName.length}/50
              </p>
            </div>
          </div>

          {(error || localError) && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700">
                {error || localError}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-3 pt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 h-12 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !projectName.trim()}
            className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold border-0 shadow-lg transition-all duration-300"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Project
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 