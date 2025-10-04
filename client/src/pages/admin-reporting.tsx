import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAdmin } from "@/contexts/admin-context";
import type { ReportingPreferencesUpdate } from "@shared/schema";
import { AlertCircle, Mail } from "lucide-react";

interface ReportingPreferencesResponse {
  id: string | null;
  supervisorId: string;
  sendCompletionEmails: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export default function AdminReporting() {
  const { adminUser } = useAdmin();
  const { toast } = useToast();
  const isSupervisor = adminUser?.role === "SUPERVISOR";

  const { data: preferences, isLoading } = useQuery<ReportingPreferencesResponse>({
    queryKey: ["/api/admin/reporting/preferences"],
    enabled: isSupervisor,
  });

  const sendEmailsEnabled = preferences?.sendCompletionEmails ?? true;

  const updatePreferencesMutation = useMutation<
    ReportingPreferencesResponse,
    Error,
    ReportingPreferencesUpdate,
    { previous?: ReportingPreferencesResponse }
  >({
    mutationFn: async (payload: ReportingPreferencesUpdate) => {
      const response = await apiRequest("PATCH", "/api/admin/reporting/preferences", payload);
      return (await response.json()) as ReportingPreferencesResponse;
    },
    onMutate: async (payload: ReportingPreferencesUpdate) => {
      await queryClient.cancelQueries({ queryKey: ["/api/admin/reporting/preferences"] });
      const previous = queryClient.getQueryData<ReportingPreferencesResponse>([
        "/api/admin/reporting/preferences",
      ]);

      queryClient.setQueryData<ReportingPreferencesResponse | undefined>(
        ["/api/admin/reporting/preferences"],
        (current) => {
          if (current) {
            return {
              ...current,
              sendCompletionEmails: payload.sendCompletionEmails,
            };
          }

          return {
            id: null,
            supervisorId: adminUser?.id ?? "",
            sendCompletionEmails: payload.sendCompletionEmails,
            createdAt: null,
            updatedAt: null,
          };
        },
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["/api/admin/reporting/preferences"], context.previous);
      }

      toast({
        title: "Unable to update preferences",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["/api/admin/reporting/preferences"], updated);
      toast({
        title: "Preferences updated",
        description: "We'll email you when learners finish their training.",
      });
    },
  });

  if (!isSupervisor) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Reporting</h2>
          <p className="text-muted-foreground">
            Completion reporting settings are managed by supervisors.
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Access restricted</h3>
              <p className="text-muted-foreground">
                Contact a supervisor if you need to manage completion notifications.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Reporting</h2>
        <p className="text-muted-foreground">
          Decide how TaskSafe keeps you informed about learner progress.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Completion status notifications
          </CardTitle>
          <CardDescription>
            Toggle automatic emails when someone from your company completes a training video.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-1">
              <p className="font-medium text-foreground">Email address</p>
              <p className="text-sm text-muted-foreground">
                We'll send updates to <span className="font-medium">{adminUser?.email}</span> when learners finish their
                assigned training.
              </p>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-11 rounded-full" />
            ) : (
              <Switch
                id="reporting-email-toggle"
                checked={sendEmailsEnabled}
                onCheckedChange={(checked) =>
                  updatePreferencesMutation.mutate({ sendCompletionEmails: checked })
                }
                disabled={updatePreferencesMutation.isPending}
                aria-label="Toggle completion email notifications"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
