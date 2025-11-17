"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Download,
  Search,
  Grid,
  List,
  Eye,
  Calendar,
  Tag,
  Users,
  FileText,
  Video,
  Palette,
  Share2,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ContentItem {
  id: string;
  name: string;
  type: string;
  category: "design" | "social-media" | "video" | "graphics";
  status: "draft" | "pending" | "approved" | "published" | "rejected";
  size: string;
  uploadDate: string;
  scheduledDate?: string;
  url: string;
  tags: string[];
  description: string;
  assignedTo?: string;
  platform?: string; // For social media posts
}

export default function Content() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState<{
    category: "design" | "social-media" | "video" | "graphics";
    description: string;
    tags: string;
    scheduledDate: string;
    platform: string;
    assignedTo: string;
  }>({
    category: "design",
    description: "",
    tags: "",
    scheduledDate: "",
    platform: "",
    assignedTo: ""
  });

  // Mock data - replace with actual API calls
  const [contentItems, setContentItems] = useState<ContentItem[]>([
    {
      id: "1",
      name: "Brand Logo V2.png",
      type: "image/png",
      category: "design",
      status: "approved",
      size: "2.4 MB",
      uploadDate: "2025-11-15",
      url: "/logo.jpg",
      tags: ["logo", "branding", "design"],
      description: "Updated brand logo with new color scheme",
      assignedTo: "Design Team"
    },
    {
      id: "2",
      name: "Instagram Post - Product Launch",
      type: "image/jpeg",
      category: "social-media",
      status: "pending",
      size: "1.8 MB",
      uploadDate: "2025-11-16",
      scheduledDate: "2025-11-20",
      url: "/placeholder.svg",
      tags: ["instagram", "product", "launch"],
      description: "Product launch announcement for Instagram",
      platform: "Instagram",
      assignedTo: "Social Media Team"
    },
    {
      id: "3",
      name: "Promo Video - Winter Sale",
      type: "video/mp4",
      category: "video",
      status: "draft",
      size: "45 MB",
      uploadDate: "2025-11-17",
      url: "/video.mp4",
      tags: ["promo", "winter", "sale"],
      description: "15-second promo video for winter sale campaign",
      assignedTo: "Design Team"
    },
  ]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    if (!uploadForm.description) {
      toast.error("Please add a description");
      return;
    }

    // Mock upload - replace with actual API call
    const newItem: ContentItem = {
      id: Date.now().toString(),
      name: selectedFile.name,
      type: selectedFile.type,
      category: uploadForm.category,
      status: "draft",
      size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
      uploadDate: new Date().toISOString().split('T')[0],
      scheduledDate: uploadForm.scheduledDate || undefined,
      url: URL.createObjectURL(selectedFile),
      tags: uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      description: uploadForm.description,
      assignedTo: uploadForm.assignedTo || undefined,
      platform: uploadForm.platform || undefined
    };

    setContentItems([newItem, ...contentItems]);
    setSelectedFile(null);
    setUploadForm({
      category: "design",
      description: "",
      tags: "",
      scheduledDate: "",
      platform: "",
      assignedTo: ""
    });
    setUploadDialogOpen(false);
    toast.success("Content uploaded successfully!");
  };

  const handleDelete = (id: string) => {
    setContentItems(contentItems.filter(item => item.id !== id));
    toast.success("Item deleted");
  };

  const handleStatusChange = (id: string, newStatus: ContentItem["status"]) => {
    setContentItems(contentItems.map(item =>
      item.id === id ? { ...item, status: newStatus } : item
    ));
    toast.success(`Status updated to ${newStatus}`);
  };

  const filteredItems = contentItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTab = activeTab === "all" || item.category === activeTab;

    return matchesSearch && matchesTab;
  });

  const getStatusBadge = (status: ContentItem["status"]) => {
    const variants = {
      draft: <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Draft</Badge>,
      pending: <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600"><Clock className="h-3 w-3" /> Pending</Badge>,
      approved: <Badge variant="outline" className="gap-1 border-green-500 text-green-600"><CheckCircle className="h-3 w-3" /> Approved</Badge>,
      published: <Badge variant="outline" className="gap-1 border-blue-500 text-blue-600"><Share2 className="h-3 w-3" /> Published</Badge>,
      rejected: <Badge variant="outline" className="gap-1 border-red-500 text-red-600"><XCircle className="h-3 w-3" /> Rejected</Badge>,
    };
    return variants[status];
  };

  const getCategoryIcon = (category: ContentItem["category"]) => {
    const icons = {
      design: <Palette className="h-5 w-5 text-purple-500" />,
      "social-media": <Share2 className="h-5 w-5 text-blue-500" />,
      video: <Video className="h-5 w-5 text-red-500" />,
      graphics: <ImageIcon className="h-5 w-5 text-green-500" />,
    };
    return icons[category];
  };

  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Content Management</h2>
            <p className="text-muted-foreground">Manage design assets and social media content</p>
          </div>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Upload Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload New Content</DialogTitle>
                <DialogDescription>Add design assets or social media content</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Select File *</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept="image/*,video/*,.pdf,.ai,.psd,.fig"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={uploadForm.category} onValueChange={(value: any) => setUploadForm({ ...uploadForm, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="design">Design Assets</SelectItem>
                      <SelectItem value="social-media">Social Media</SelectItem>
                      <SelectItem value="video">Video Content</SelectItem>
                      <SelectItem value="graphics">Graphics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe this content..."
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="design, branding, logo (comma separated)"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  />
                </div>

                {uploadForm.category === "social-media" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="platform">Platform</Label>
                      <Select value={uploadForm.platform} onValueChange={(value) => setUploadForm({ ...uploadForm, platform: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="Facebook">Facebook</SelectItem>
                          <SelectItem value="Twitter">Twitter/X</SelectItem>
                          <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                          <SelectItem value="TikTok">TikTok</SelectItem>
                          <SelectItem value="YouTube">YouTube</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scheduled">Scheduled Date</Label>
                      <Input
                        id="scheduled"
                        type="date"
                        value={uploadForm.scheduledDate}
                        onChange={(e) => setUploadForm({ ...uploadForm, scheduledDate: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="assigned">Assign To</Label>
                  <Select value={uploadForm.assignedTo} onValueChange={(value) => setUploadForm({ ...uploadForm, assignedTo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Design Team">Design Team</SelectItem>
                      <SelectItem value="Social Media Team">Social Media Team</SelectItem>
                      <SelectItem value="Marketing Team">Marketing Team</SelectItem>
                      <SelectItem value="Content Team">Content Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleUpload} className="w-full gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Content
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Content</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contentItems.length}</div>
              <p className="text-xs text-muted-foreground">All items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contentItems.filter(i => i.status === "pending").length}</div>
              <p className="text-xs text-muted-foreground">Needs approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contentItems.filter(i => i.status === "approved").length}</div>
              <p className="text-xs text-muted-foreground">Ready to publish</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contentItems.filter(i => i.scheduledDate).length}</div>
              <p className="text-xs text-muted-foreground">Upcoming posts</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({contentItems.length})</TabsTrigger>
            <TabsTrigger value="design">
              Design ({contentItems.filter(i => i.category === "design").length})
            </TabsTrigger>
            <TabsTrigger value="social-media">
              Social ({contentItems.filter(i => i.category === "social-media").length})
            </TabsTrigger>
            <TabsTrigger value="video">
              Video ({contentItems.filter(i => i.category === "video").length})
            </TabsTrigger>
            <TabsTrigger value="graphics">
              Graphics ({contentItems.filter(i => i.category === "graphics").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredItems.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No content found</p>
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-muted relative">
                      {item.type.startsWith("image") ? (
                        <Image
                          src={item.url}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : item.type.startsWith("video") ? (
                        <div className="flex items-center justify-center h-full">
                          <Video className="h-12 w-12 text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <FileText className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="absolute top-2 left-2">
                        {getCategoryIcon(item.category)}
                      </div>
                    </div>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base line-clamp-1">{item.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {item.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {item.platform && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Share2 className="h-3 w-3" />
                          {item.platform}
                        </div>
                      )}

                      {item.scheduledDate && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.scheduledDate).toLocaleDateString()}
                        </div>
                      )}

                      {item.assignedTo && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {item.assignedTo}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedItem(item);
                            setDetailsDialogOpen(true);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => window.open(item.url)}>
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {filteredItems.map((item) => (
                      <div key={item.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {getCategoryIcon(item.category)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <h3 className="font-semibold">{item.name}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                              </div>
                              {getStatusBadge(item.status)}
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <span>{item.size}</span>
                              <span>•</span>
                              <span>{item.uploadDate}</span>
                              {item.assignedTo && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {item.assignedTo}
                                  </span>
                                </>
                              )}
                              {item.platform && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Share2 className="h-3 w-3" />
                                    {item.platform}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.tags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => window.open(item.url)}>
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedItem?.name}</DialogTitle>
              <DialogDescription>Content Details</DialogDescription>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                <div className="aspect-video bg-muted relative rounded-lg overflow-hidden">
                  {selectedItem.type.startsWith("image") ? (
                    <Image
                      src={selectedItem.url}
                      alt={selectedItem.name}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <FileText className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="grid gap-4">
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <p className="text-sm mt-1">{selectedItem.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Size</Label>
                      <p className="text-sm mt-1">{selectedItem.size}</p>
                    </div>
                    <div>
                      <Label>Upload Date</Label>
                      <p className="text-sm mt-1">{selectedItem.uploadDate}</p>
                    </div>
                  </div>

                  {selectedItem.assignedTo && (
                    <div>
                      <Label>Assigned To</Label>
                      <p className="text-sm mt-1">{selectedItem.assignedTo}</p>
                    </div>
                  )}

                  {selectedItem.platform && (
                    <div>
                      <Label>Platform</Label>
                      <p className="text-sm mt-1">{selectedItem.platform}</p>
                    </div>
                  )}

                  {selectedItem.scheduledDate && (
                    <div>
                      <Label>Scheduled For</Label>
                      <p className="text-sm mt-1">{new Date(selectedItem.scheduledDate).toLocaleDateString()}</p>
                    </div>
                  )}

                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedItem.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Update Status</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selectedItem.status === "draft" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusChange(selectedItem.id, "draft")}
                      >
                        Draft
                      </Button>
                      <Button
                        variant={selectedItem.status === "pending" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusChange(selectedItem.id, "pending")}
                      >
                        Pending
                      </Button>
                      <Button
                        variant={selectedItem.status === "approved" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusChange(selectedItem.id, "approved")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant={selectedItem.status === "published" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusChange(selectedItem.id, "published")}
                      >
                        Publish
                      </Button>
                      <Button
                        variant={selectedItem.status === "rejected" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusChange(selectedItem.id, "rejected")}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
