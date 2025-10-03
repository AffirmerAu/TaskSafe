import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAdmin } from "@/contexts/admin-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Building,
  Mail,
  Shield,
  Share2,
  AlertCircle,
  Loader2
} from "lucide-react";
import type { AdminUser, CompanyTag } from "@shared/schema";

interface SupervisorFormData {
  email: string;
  password: string;
  companyTag?: string;
}

interface SupervisorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: SupervisorFormData;
  onFormChange: (field: keyof SupervisorFormData, value: string) => void;
  isEditing: boolean;
  isSuperAdmin: boolean;
  companyTags: CompanyTag[];
  defaultCompanyTag?: string | null;
}

function SupervisorDialog({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  isEditing,
  isSuperAdmin,
  companyTags,
  defaultCompanyTag,
}: SupervisorDialogProps) {
  const assignedCompany = defaultCompanyTag ?? "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Supervisor" : "Add Supervisor"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="supervisor-email">Email Address</Label>
            <Input
              id="supervisor-email"
              type="email"
              value={formData.email}
              onChange={(event) => onFormChange("email", event.target.value)}
              placeholder="supervisor@company.com"
              required
              data-testid="input-supervisor-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supervisor-password">
              {isEditing ? "New Password (optional)" : "Password"}
            </Label>
            <Input
              id="supervisor-password"
              type="password"
              value={formData.password}
              onChange={(event) => onFormChange("password", event.target.value)}
              placeholder="Enter password"
              required={!isEditing}
              data-testid="input-supervisor-password"
            />
            <p className="text-xs text-muted-foreground">
              Passwords must be at least 6 characters long.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supervisor-company">Company</Label>
            {isSuperAdmin ? (
              <Select
                value={formData.companyTag || ""}
                onValueChange={(value) => onFormChange("companyTag", value)}
                required
                data-testid="select-supervisor-company"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companyTags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.name}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="supervisor-company"
                value={assignedCompany || "Unassigned"}
                disabled
                readOnly
              />
            )}
            <p className="text-xs text-muted-foreground">
              Supervisors can only access videos and completions for their company.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-supervisor">
              {isEditing ? "Update Supervisor" : "Create Supervisor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminSupervisors() {
  const { adminUser } = useAdmin();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<Omit<AdminUser, "password"> | null>(null);
  const [formData, setFormData] = useState<SupervisorFormData>({
    email: "",
    password: "",
    companyTag: adminUser?.companyTag ?? "",
  });

  const isSuperAdmin = adminUser?.role === "SUPER_ADMIN";
  const isSupervisor = adminUser?.role === "SUPERVISOR";

  const { data: companyTags = [], isLoading: isLoadingCompanyTags } = useQuery<CompanyTag[]>({
    queryKey: ["/api/admin/company-tags"],
    enabled: isSuperAdmin,
  });

  const { data: supervisors = [], isLoading } = useQuery<Omit<AdminUser, "password">[]>({
    queryKey: ["/api/admin/supervisors"],
    enabled: !isSupervisor,
  });

  const handleFormChange = (field: keyof SupervisorFormData, value: string) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      companyTag: adminUser?.companyTag ?? "",
    });
    setEditingSupervisor(null);
  };

  const createSupervisorMutation = useMutation({
    mutationFn: (payload: SupervisorFormData) => apiRequest("POST", "/api/admin/supervisors", payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/supervisors"] });
      setIsDialogOpen(false);
      toast({
        title: "Supervisor Created",
        description: "Share the login email and password with the supervisor.",
      });
      toast({
        title: "Login Details",
        description: `Email: ${variables.email}`,
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create supervisor.",
        variant: "destructive",
      });
    },
  });

  const updateSupervisorMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<SupervisorFormData> }) =>
      apiRequest("PATCH", `/api/admin/supervisors/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/supervisors"] });
      setIsDialogOpen(false);
      toast({
        title: "Supervisor Updated",
        description: "The supervisor's details have been updated.",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update supervisor.",
        variant: "destructive",
      });
    },
  });

  const deleteSupervisorMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/supervisors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/supervisors"] });
      toast({
        title: "Supervisor Deleted",
        description: "The supervisor has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete supervisor.",
        variant: "destructive",
      });
    },
  });

  const handleAddSupervisor = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditSupervisor = (supervisor: Omit<AdminUser, "password">) => {
    setEditingSupervisor(supervisor);
    setFormData({
      email: supervisor.email,
      password: "",
      companyTag: supervisor.companyTag ?? adminUser?.companyTag ?? "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteSupervisor = (supervisor: Omit<AdminUser, "password">) => {
    if (confirm(`Are you sure you want to remove ${supervisor.email}?`)) {
      deleteSupervisorMutation.mutate(supervisor.id);
    }
  };

  const handleSaveSupervisor = () => {
    if (!adminUser) {
      return;
    }

    if (editingSupervisor) {
      const payload: Partial<SupervisorFormData> = {};

      if (formData.email && formData.email !== editingSupervisor.email) {
        payload.email = formData.email;
      }

      if (formData.password) {
        payload.password = formData.password;
      }

      if (isSuperAdmin) {
        payload.companyTag = formData.companyTag;
      }

      if (Object.keys(payload).length === 0) {
        toast({
          title: "No Changes",
          description: "Update the supervisor details before saving.",
          variant: "destructive",
        });
        return;
      }

      updateSupervisorMutation.mutate({ id: editingSupervisor.id, payload });
      return;
    }

    if (!isSuperAdmin && !adminUser.companyTag) {
      toast({
        title: "Missing Company",
        description: "Assign your administrator account to a company before adding supervisors.",
        variant: "destructive",
      });
      return;
    }

    if (isSuperAdmin && !formData.companyTag) {
      toast({
        title: "Company Required",
        description: "Select a company for the supervisor.",
        variant: "destructive",
      });
      return;
    }

    const payload: SupervisorFormData = {
      email: formData.email,
      password: formData.password,
      companyTag: isSuperAdmin ? formData.companyTag : adminUser.companyTag ?? undefined,
    };

    createSupervisorMutation.mutate(payload);
  };

  const handleShareSupervisor = (supervisor: Omit<AdminUser, "password">) => {
    const loginUrl = `${window.location.origin}/admin/login`;
    const details = `TaskSafe Supervisor Access\n\nEmail: ${supervisor.email}\nCompany: ${supervisor.companyTag ?? "Unassigned"}\nLogin: ${loginUrl}`;

    navigator.clipboard.writeText(details).then(() => {
      toast({
        title: "Details Copied",
        description: "Share the copied login details with the supervisor.",
      });
    }).catch(() => {
      toast({
        title: "Unable to Copy",
        description: "Copy the supervisor details manually.",
        variant: "destructive",
      });
    });
  };

  const assignedCompanyLabel = useMemo(() => {
    if (isSuperAdmin) {
      return "All Companies";
    }
    return adminUser?.companyTag ?? "Unassigned";
  }, [adminUser?.companyTag, isSuperAdmin]);

  if (isSupervisor) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Supervisors</h2>
          <p className="text-muted-foreground">
            Supervisors can only be managed by administrators.
          </p>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              Contact your administrator if you need supervisor access changes.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuperAdmin && isLoadingCompanyTags) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Supervisors</h2>
          <p className="text-muted-foreground">
            Manage supervisors for {assignedCompanyLabel.toLowerCase()}.
          </p>
        </div>
        <Button onClick={handleAddSupervisor} data-testid="button-add-supervisor">
          <Plus className="h-4 w-4 mr-2" />
          Add Supervisor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Supervisors</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{supervisors.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Companies Represented</span>
            </div>
            <div className="text-2xl font-bold">
              {new Set(supervisors.map((supervisor) => supervisor.companyTag || "unassigned")).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium">Managed Access</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              {adminUser?.role === "SUPER_ADMIN" ? "All Companies" : adminUser?.companyTag ?? "Unassigned"}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading supervisors...</p>
          </CardContent>
        </Card>
      ) : supervisors.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No supervisors yet</h3>
            <p className="text-muted-foreground mb-4">
              Add supervisors to manage videos and completions for your company.
            </p>
            <Button onClick={handleAddSupervisor}>
              <Plus className="h-4 w-4 mr-2" />
              Add Supervisor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {supervisors.map((supervisor) => (
            <Card key={supervisor.id}>
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-foreground">{supervisor.email}</h3>
                    <Badge variant="secondary">Supervisor</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      <Mail className="h-4 w-4" />
                      <span>{supervisor.email}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Building className="h-4 w-4" />
                      <span>{supervisor.companyTag ?? "Unassigned"}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShareSupervisor(supervisor)}
                    data-testid={`button-share-supervisor-${supervisor.id}`}
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSupervisor(supervisor)}
                    data-testid={`button-edit-supervisor-${supervisor.id}`}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteSupervisor(supervisor)}
                    data-testid={`button-delete-supervisor-${supervisor.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SupervisorDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          resetForm();
        }}
        onSubmit={handleSaveSupervisor}
        formData={formData}
        onFormChange={handleFormChange}
        isEditing={Boolean(editingSupervisor)}
        isSuperAdmin={isSuperAdmin}
        companyTags={companyTags}
        defaultCompanyTag={adminUser?.companyTag ?? null}
      />
    </div>
  );
}
