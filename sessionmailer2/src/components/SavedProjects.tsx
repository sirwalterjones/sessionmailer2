"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Folder,
  Calendar,
  Trash2,
  Download,
  Eye,
  MoreVertical,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SavedProject, ProjectCustomization } from "@/lib/supabase";

interface SavedProjectsProps {
  onLoadProject: (project: SavedProject) => void;
  refreshTrigger?: number;
}

export default function SavedProjects({ onLoadProject, refreshTrigger }: SavedProjectsProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`/api/projects?userId=${user.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch projects');
      }

      setProjects(data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError(error instanceof Error ? error.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!user?.id) return;

    try {
      setDeletingId(projectId);
      setError("");

      const response = await fetch(`/api/projects?projectId=${projectId}&userId=${user.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete project');
      }

      // Remove the project from the list
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyHtml = async (emailHtml: string) => {
    try {
      await navigator.clipboard.writeText(emailHtml);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy HTML:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchProjects();
  }, [user?.id, refreshTrigger]);

  if (!user) {
    return (
      <Card className="glass-card border-0 shadow-2xl">
        <CardContent className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">Please sign in to view your saved projects</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="glass-card border-0 shadow-2xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
              <Folder className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">Saved Projects</CardTitle>
              <CardDescription className="text-gray-600">
                Your beautiful email templates
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-0 shadow-2xl card-hover">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
              <Folder className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800">Saved Projects</CardTitle>
              <CardDescription className="text-gray-600 text-sm sm:text-base">
                {projects.length === 0 
                  ? "No saved projects yet" 
                  : `${projects.length} saved ${projects.length === 1 ? 'project' : 'projects'}`
                }
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-0 self-start sm:self-center">
            {projects.length} Total
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
              <Folder className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Projects Yet</h3>
            <p className="text-gray-600 max-w-sm">
              Create and save your first email template to see it here. Your saved projects will include all your customizations.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border-2 border-gray-100 hover:border-purple-200 transition-all duration-300 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="font-semibold text-gray-800 truncate">{project.name}</h3>
                      {project.customization && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-0 self-start">
                          Customized
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(project.created_at)}
                      </div>
                      <div className="truncate text-xs sm:text-sm">
                        {project.url}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onLoadProject(project)}
                      className="gap-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 text-xs sm:text-sm"
                    >
                      <Eye className="h-3 w-3" />
                      Load
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => handleCopyHtml(project.email_html)}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteProject(project.id)}
                          disabled={deletingId === project.id}
                          className="gap-2 text-red-600 focus:text-red-600"
                        >
                          {deletingId === project.id ? (
                            <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 