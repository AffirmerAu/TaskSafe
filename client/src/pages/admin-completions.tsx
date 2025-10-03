import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAdmin } from "@/contexts/admin-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { type CompanyTag } from "@shared/schema";
import {
  DownloadIcon,
  FilterIcon,
  Calendar,
  Mail,
  Video,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CompletionRecord {
  id: string;
  email: string;
  videoTitle: string;
  videoId: string;
  accessedAt: string;
  watchDuration: number;
  completionPercentage: number;
  companyTag?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface FilterState {
  dateFrom: string;
  dateTo: string;
  videoId: string;
  companyTag: string;
  completionStatus: string;
  searchTerm: string;
}

export default function AdminCompletions() {
  const { adminUser } = useAdmin();
  const { toast } = useToast();
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: "",
    dateTo: "",
    videoId: "",
    companyTag: "all",
    completionStatus: "",
    searchTerm: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const isSuperAdmin = adminUser?.role === "SUPER_ADMIN";
  const isSupervisor = adminUser?.role === "SUPERVISOR";
  const supervisorCompanyTag = isSupervisor ? adminUser?.companyTag ?? null : null;

  // Fetch completion data
  const { data: completions = [], isLoading } = useQuery<CompletionRecord[]>({
    queryKey: ["/api/admin/completions"],
    refetchInterval: 30000,
  });

  const { data: companyTags = [] } = useQuery<CompanyTag[]>({
    queryKey: ["/api/admin/company-tags"],
    enabled: isSuperAdmin,
  });

  // Fetch videos for filter dropdown
  const { data: videos = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/videos"],
    refetchInterval: 30000,
  });

  const derivedCompanyTags = useMemo(() => {
    const tags = new Set<string>();
    for (const completion of completions) {
      if (completion.companyTag) {
        tags.add(completion.companyTag);
      }
    }
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [completions]);

  const hasUnassignedCompletions = useMemo(
    () => completions.some(completion => !completion.companyTag),
    [completions],
  );

  const availableCompanyTags = useMemo(() => {
    if (isSuperAdmin) {
      const superAdminTags = companyTags.map(tag => tag.name);
      return Array.from(new Set([...superAdminTags, ...derivedCompanyTags])).sort((a, b) =>
        a.localeCompare(b),
      );
    }
    return derivedCompanyTags;
  }, [companyTags, derivedCompanyTags, isSuperAdmin]);

  const companyFilterOptions = useMemo(
    () => [
      ...availableCompanyTags.map(tag => ({ value: tag, label: tag })),
      ...(hasUnassignedCompletions
        ? [{ value: "__unassigned__", label: "Unassigned" }]
        : []),
    ],
    [availableCompanyTags, hasUnassignedCompletions],
  );

  const canFilterByCompany = adminUser?.role === "SUPER_ADMIN" || adminUser?.role === "ADMIN";

  const formatCompanyTag = (tag?: string | null) => tag ?? "Unassigned";

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter and search logic
  const filteredCompletions = useMemo(() => {
    let filtered = completions;

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(c => new Date(c.accessedAt) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(c => new Date(c.accessedAt) <= toDate);
    }

    // Video filter
    if (filters.videoId && filters.videoId !== "all") {
      filtered = filtered.filter(c => c.videoId === filters.videoId);
    }

    // Company tag filter
    if (filters.companyTag && filters.companyTag !== "all") {
      if (filters.companyTag === "__unassigned__") {
        filtered = filtered.filter(c => !c.companyTag);
      } else {
        filtered = filtered.filter(c => c.companyTag === filters.companyTag);
      }
    }

    // Completion status filter
    if (filters.completionStatus && filters.completionStatus !== "all") {
      const isCompleted = filters.completionStatus === "completed";
      filtered = filtered.filter(c =>
        isCompleted ? c.completionPercentage >= 100 : c.completionPercentage < 100
      );
    }

    if (supervisorCompanyTag) {
      filtered = filtered.filter(c => c.companyTag === supervisorCompanyTag);
    }

    // Search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.email.toLowerCase().includes(term) ||
        c.videoTitle.toLowerCase().includes(term) ||
        (c.companyTag && c.companyTag.toLowerCase().includes(term))
      );
    }

    return filtered.sort((a, b) => new Date(b.accessedAt).getTime() - new Date(a.accessedAt).getTime());
  }, [completions, filters, supervisorCompanyTag]);

  // Export to CSV
  const exportToCSV = () => {
    if (filteredCompletions.length === 0) {
      toast({
        title: "No data to export",
        description: "Please adjust your filters to include some data.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Timestamp",
      "Email",
      "Video Title", 
      "Company Tag",
      "Watch Duration (min)",
      "Completion %",
      "Completed",
      "IP Address"
    ];

    const csvData = filteredCompletions.map(record => [
      format(new Date(record.accessedAt), "yyyy-MM-dd HH:mm:ss"),
      record.email,
      record.videoTitle,
      formatCompanyTag(record.companyTag),
      Math.round(record.watchDuration / 60 * 100) / 100,
      record.completionPercentage,
      record.completionPercentage >= 100 ? "Yes" : "No",
      record.ipAddress || ""
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `completions-report-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredCompletions.length} records to CSV.`,
    });
  };

  const resetFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      videoId: "",
      companyTag: "all",
      completionStatus: "",
      searchTerm: "",
    });
  };

  const getCompletionBadge = (percentage: number) => {
    if (percentage >= 100) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Complete</Badge>;
    } else if (percentage >= 75) {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
    } else {
      return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Started</Badge>;
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getEmailDomain = (email: string) => {
    return email.split('@')[1] || '';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Completions</h2>
          <p className="text-muted-foreground">Loading completion data...</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Completions</h2>
          <p className="text-muted-foreground">
            Training completion reports ({filteredCompletions.length} of {completions.length} records)
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <FilterIcon className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button
            onClick={exportToCSV}
            disabled={filteredCompletions.length === 0}
            data-testid="button-export-csv"
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FilterIcon className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">From Date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  data-testid="input-date-from"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  data-testid="input-date-to"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="videoFilter">Video</Label>
                <Select
                  value={filters.videoId}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, videoId: value }))}
                >
                  <SelectTrigger data-testid="select-video-filter">
                    <SelectValue placeholder="All videos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All videos</SelectItem>
                    {videos.map((video: any) => (
                      <SelectItem key={video.id} value={video.id}>
                        {video.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {canFilterByCompany && (
                <div className="space-y-2">
                  <Label htmlFor="companyTag">Company</Label>
                  <Select
                    value={filters.companyTag}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, companyTag: value }))}
                  >
                    <SelectTrigger id="companyTag" data-testid="select-company-filter">
                      <SelectValue placeholder="All companies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All companies</SelectItem>
                      {companyFilterOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="completionStatus">Completion Status</Label>
                <Select
                  value={filters.completionStatus}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, completionStatus: value }))}
                >
                  <SelectTrigger data-testid="select-completion-status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="completed">Completed (100%)</SelectItem>
                    <SelectItem value="incomplete">Incomplete (&lt;100%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="searchTerm">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="searchTerm"
                    placeholder="Email, video, or tag..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={resetFilters} data-testid="button-reset-filters">
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Video className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Views</span>
            </div>
            <div className="text-2xl font-bold">{filteredCompletions.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Completed</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {filteredCompletions.filter(c => c.completionPercentage >= 100).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Unique Users</span>
            </div>
            <div className="text-2xl font-bold">
              {new Set(filteredCompletions.map(c => c.email)).size}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Companies</span>
            </div>
            <div className="text-2xl font-bold">
              {new Set(filteredCompletions.map(c => formatCompanyTag(c.companyTag))).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completions Table */}
      {filteredCompletions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No completion data found</h3>
            <p className="text-muted-foreground">
              {completions.length === 0 
                ? "No training completions have been recorded yet."
                : "Try adjusting your filters to see more results."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4 font-medium hidden md:table-cell">Timestamp</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium hidden md:table-cell">Video Title</th>
                    <th className="p-4 font-medium hidden md:table-cell">Company Tag</th>
                    <th className="p-4 font-medium hidden md:table-cell">Watched</th>
                    <th className="p-4 font-medium hidden md:table-cell">Completion</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompletions.map((record) => (
                    <Fragment key={record.id}>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-4 hidden md:table-cell" data-testid={`timestamp-${record.id}`}>
                          <div>{format(new Date(record.accessedAt), "MMM dd, yyyy")}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(record.accessedAt), "HH:mm:ss")}
                          </div>
                        </td>
                        <td className="p-4" data-testid={`email-${record.id}`}>
                          <div className="font-medium">{record.email}</div>
                          <div className="text-xs text-muted-foreground">
                            @{getEmailDomain(record.email)}
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell" data-testid={`video-${record.id}`}>
                          <div className="font-medium line-clamp-2">{record.videoTitle}</div>
                        </td>
                        <td className="p-4 hidden md:table-cell" data-testid={`company-${record.id}`}>
                          <Badge variant="outline">{formatCompanyTag(record.companyTag)}</Badge>
                        </td>
                        <td className="p-4 hidden md:table-cell" data-testid={`duration-${record.id}`}>
                          <div>{formatDuration(record.watchDuration)}</div>
                        </td>
                        <td className="p-4 hidden md:table-cell" data-testid={`completion-${record.id}`}>
                          <div className="font-medium">{record.completionPercentage}%</div>
                          <div className="w-24 bg-muted rounded-full h-1">
                            <div
                              className="bg-primary h-1 rounded-full"
                              style={{ width: `${Math.min(record.completionPercentage, 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="p-4" data-testid={`status-${record.id}`}>
                          <div className="flex items-center justify-between gap-2">
                            {getCompletionBadge(record.completionPercentage)}
                            <button
                              type="button"
                              className="md:hidden text-muted-foreground hover:text-foreground"
                              onClick={() => toggleRow(record.id)}
                              aria-expanded={Boolean(expandedRows[record.id])}
                              aria-controls={`completion-details-${record.id}`}
                            >
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 transition-transform",
                                  expandedRows[record.id] ? "rotate-180" : "",
                                )}
                              />
                              <span className="sr-only">Toggle completion details</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows[record.id] && (
                        <tr className="md:hidden" id={`completion-details-${record.id}`}>
                          <td colSpan={7} className="px-4 pb-4">
                            <div className="rounded-md border bg-muted/30 p-3 space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Timestamp</span>
                                <span className="font-medium">
                                  {format(new Date(record.accessedAt), "MMM dd, yyyy HH:mm:ss")}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Video</span>
                                <div className="font-medium">{record.videoTitle}</div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Company Tag</span>
                                <Badge variant="outline">{formatCompanyTag(record.companyTag)}</Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Watched</span>
                                <span className="font-medium">{formatDuration(record.watchDuration)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Completion</span>
                                <span className="font-medium">{record.completionPercentage}%</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}