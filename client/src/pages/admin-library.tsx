import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAdmin } from "@/contexts/admin-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Plus,
  Edit,
  Trash2,
  Copy as CopyIcon,
  Clock,
  Tag,
  Mail,
  BookOpen,
  Eye,
  Building2,
} from "lucide-react";
import type { LibraryVideo, CompanyTag } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LibraryVideoFormData {
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  category: string;
  completionEmail?: string;
  isActive: boolean;
}

function LibraryVideoDialog({
  video,
  isOpen,
  onClose,
  onSave,
  isSubmitting,
}: {
  video?: LibraryVideo;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: LibraryVideoFormData) => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<LibraryVideoFormData>({
    title: video?.title ?? "",
    description: video?.description ?? "",
    thumbnailUrl: video?.thumbnailUrl ?? "",
    videoUrl: video?.videoUrl ?? "",
    duration: video?.duration ?? "",
    category: video?.category ?? "",
    completionEmail: video?.completionEmail ?? "",
    isActive: video?.isActive ?? true,
  });

  useEffect(() => {
    if (!isOpen) return;

    setFormData({
      title: video?.title ?? "",
      description: video?.description ?? "",
      thumbnailUrl: video?.thumbnailUrl ?? "",
      videoUrl: video?.videoUrl ?? "",
      duration: video?.duration ?? "",
      category: video?.category ?? "",
      completionEmail: video?.completionEmail ?? "",
      isActive: video?.isActive ?? true,
    });
  }, [video, isOpen]);

  const handleChange = (field: keyof LibraryVideoFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{video ? "Edit Library Video" : "Add Library Video"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="library-title">Title</Label>
              <Input
                id="library-title"
                value={formData.title}
                onChange={(event) => handleChange("title", event.target.value)}
                placeholder="Video title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="library-category">Category</Label>
              <Input
                id="library-category"
                value={formData.category}
                onChange={(event) => handleChange("category", event.target.value)}
                placeholder="e.g., Safety Training"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="library-description">Description</Label>
            <Textarea
              id="library-description"
              value={formData.description}
              onChange={(event) => handleChange("description", event.target.value)}
              placeholder="Video description"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="library-video-url">Video URL</Label>
              <Input
                id="library-video-url"
                value={formData.videoUrl}
                onChange={(event) => handleChange("videoUrl", event.target.value)}
                placeholder="https://example.com/video.mp4"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="library-duration">Duration</Label>
              <Input
                id="library-duration"
                value={formData.duration}
                onChange={(event) => handleChange("duration", event.target.value)}
                placeholder="e.g., 12:34"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="library-thumbnail">Thumbnail URL</Label>
              <Input
                id="library-thumbnail"
                value={formData.thumbnailUrl}
                onChange={(event) => handleChange("thumbnailUrl", event.target.value)}
                placeholder="https://example.com/thumbnail.jpg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="library-completion-email">Completion Notification Email</Label>
              <Input
                id="library-completion-email"
                type="email"
                value={formData.completionEmail ?? ""}
                onChange={(event) => handleChange("completionEmail", event.target.value)}
                placeholder="training@company.com"
              />
              <p className="text-xs text-muted-foreground">
                Optional. Learner completions will notify this email when copied.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-dashed border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Active in library</p>
              <p className="text-xs text-muted-foreground">
                Inactive videos stay in the library but are hidden from supervisors.
              </p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange("isActive", checked)}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : video ? "Save Changes" : "Add Video"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CopyToCompanyDialog({
  video,
  isOpen,
  onClose,
  onConfirm,
  companyTags,
  isLoading,
  selectedCompanyTag,
  onChangeCompanyTag,
}: {
  video?: LibraryVideo;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  companyTags: CompanyTag[];
  isLoading: boolean;
  selectedCompanyTag: string;
  onChangeCompanyTag: (value: string) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Select company for {video?.title ?? "video"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose which company should receive this library video.
          </p>

          <div className="space-y-2">
            <Label htmlFor="copy-company">Company</Label>
            <Select
              value={selectedCompanyTag}
              onValueChange={onChangeCompanyTag}
              disabled={isLoading || companyTags.length === 0}
            >
              <SelectTrigger id="copy-company">
                <SelectValue placeholder={isLoading ? "Loading companies..." : "Select a company"} />
              </SelectTrigger>
              <SelectContent>
                {companyTags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.name}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {companyTags.length === 0 && !isLoading ? (
              <p className="text-xs text-muted-foreground">
                No companies available. Create a company tag first.
              </p>
            ) : null}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={!selectedCompanyTag}>
              Copy Video
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminLibrary() {
  const { adminUser } = useAdmin();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<LibraryVideo | undefined>();
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [videoToCopy, setVideoToCopy] = useState<LibraryVideo | undefined>();
  const [selectedCompanyTag, setSelectedCompanyTag] = useState<string>("");

  const canManageLibrary = adminUser?.role !== "SUPERVISOR";
  const isSuperAdmin = adminUser?.role === "SUPER_ADMIN";

  const { data: libraryVideos = [], isLoading } = useQuery<LibraryVideo[]>({
    queryKey: ["/api/admin/library"],
    refetchInterval: 30000,
  });

  const { data: companyTags = [], isLoading: isLoadingCompanyTags } = useQuery<CompanyTag[]>({
    queryKey: ["/api/admin/company-tags"],
    enabled: isSuperAdmin,
  });

  useEffect(() => {
    if (!isCopyDialogOpen) {
      setSelectedCompanyTag("");
      return;
    }

    if (!selectedCompanyTag && companyTags.length > 0) {
      setSelectedCompanyTag(companyTags[0].name);
    }
  }, [isCopyDialogOpen, selectedCompanyTag, companyTags]);

  const [isCreatingOrUpdating, setIsCreatingOrUpdating] = useState(false);

  const createVideoMutation = useMutation({
    mutationFn: (data: LibraryVideoFormData) => apiRequest("POST", "/api/admin/library", data),
    onMutate: () => setIsCreatingOrUpdating(true),
    onSettled: () => setIsCreatingOrUpdating(false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/library"] });
      setIsDialogOpen(false);
      toast({
        title: "Library video added",
        description: "The video is now available to supervisors.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to add video",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateVideoMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LibraryVideoFormData }) =>
      apiRequest("PATCH", `/api/admin/library/${id}`, data),
    onMutate: () => setIsCreatingOrUpdating(true),
    onSettled: () => setIsCreatingOrUpdating(false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/library"] });
      setIsDialogOpen(false);
      setEditingVideo(undefined);
      toast({
        title: "Library video updated",
        description: "Changes saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to update video",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/library/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/library"] });
      toast({
        title: "Library video removed",
        description: "The video is no longer available.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to delete video",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const copyVideoMutation = useMutation({
    mutationFn: ({ videoId, companyTag }: { videoId: string; companyTag?: string }) =>
      apiRequest(
        "POST",
        `/api/admin/library/${videoId}/copy`,
        companyTag ? { companyTag } : undefined,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/videos"] });
      toast({
        title: "Video copied",
        description: "The video has been added to your videos list.",
      });
      setIsCopyDialogOpen(false);
      setVideoToCopy(undefined);
      setSelectedCompanyTag("");
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to copy video",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = (data: LibraryVideoFormData) => {
    if (editingVideo) {
      updateVideoMutation.mutate({ id: editingVideo.id, data });
    } else {
      createVideoMutation.mutate(data);
    }
  };

  const handleDelete = (video: LibraryVideo) => {
    if (!confirm(`Delete "${video.title}" from the library?`)) {
      return;
    }
    deleteVideoMutation.mutate(video.id);
  };

  const handleCopy = (video: LibraryVideo) => {
    if (isSuperAdmin) {
      setVideoToCopy(video);
      setIsCopyDialogOpen(true);
      return;
    }

    setVideoToCopy(video);
    copyVideoMutation.mutate({ videoId: video.id });
  };

  const visibleLibraryVideos = useMemo(() => {
    if (canManageLibrary) {
      return libraryVideos;
    }
    return libraryVideos.filter(video => video.isActive);
  }, [libraryVideos, canManageLibrary]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            Training Library
          </h2>
          <p className="text-muted-foreground">
            Browse ready-to-use training videos and copy them into your company workspace.
          </p>
        </div>

        {canManageLibrary && (
          <Button onClick={() => setIsDialogOpen(true)} disabled={isCreatingOrUpdating}>
            <Plus className="h-4 w-4 mr-2" />
            Add Library Video
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="animate-pulse">
              <div className="h-40 w-full bg-muted rounded-t-lg" />
              <CardContent className="space-y-3 p-4">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : visibleLibraryVideos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 space-y-4">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">No library videos yet</h3>
              <p className="text-muted-foreground">
                {canManageLibrary
                  ? "Add your first video to share it with supervisors."
                  : "Check back soon for new training resources."}
              </p>
            </div>
            {canManageLibrary && (
              <Button onClick={() => setIsDialogOpen(true)} disabled={isCreatingOrUpdating}>
                <Plus className="h-4 w-4 mr-2" />
                Add Library Video
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleLibraryVideos.map((video) => (
            <Card key={video.id} className="group overflow-hidden border border-border">
              <div className="relative">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="h-40 w-full object-cover"
                  onError={(event) => {
                    const image = event.target as HTMLImageElement;
                    image.src = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80";
                  }}
                />
                {!video.isActive && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">Inactive</span>
                  </div>
                )}
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{video.category}</p>
                  </div>
                  {canManageLibrary && (
                    <div className="flex space-x-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingVideo(video);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(video)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">{video.description}</p>

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {video.duration}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {video.category}
                  </span>
                  {video.completionEmail && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {video.completionEmail}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(video.videoUrl, "_blank")}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleCopy(video)}
                    disabled={copyVideoMutation.isPending && videoToCopy?.id === video.id}
                  >
                    <CopyIcon className="h-4 w-4 mr-2" />
                    Copy to My Videos
                  </Button>
                </div>

                {isSuperAdmin && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    Choose a company after selecting copy.
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <LibraryVideoDialog
        video={editingVideo}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingVideo(undefined);
        }}
        onSave={handleSave}
        isSubmitting={isCreatingOrUpdating}
      />

      <CopyToCompanyDialog
        video={videoToCopy}
        isOpen={isCopyDialogOpen}
        onClose={() => {
          setIsCopyDialogOpen(false);
          setVideoToCopy(undefined);
        }}
        companyTags={companyTags}
        isLoading={isLoadingCompanyTags}
        selectedCompanyTag={selectedCompanyTag}
        onChangeCompanyTag={setSelectedCompanyTag}
        onConfirm={() => {
          if (!videoToCopy || !selectedCompanyTag) {
            toast({
              title: "Select a company",
              description: "Choose a company to copy this video into.",
            });
            return;
          }
          copyVideoMutation.mutate({ videoId: videoToCopy.id, companyTag: selectedCompanyTag });
        }}
      />
    </div>
  );
}
