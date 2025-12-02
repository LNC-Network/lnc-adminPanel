"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Mail, 
  Send, 
  Inbox, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  FileText,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Eye
} from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  created_at: string;
}

interface EmailQueue {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  scheduled_at: string;
  sent_at?: string;
  error_message?: string;
}

interface MailingStats {
  totalSent: number;
  totalPending: number;
  totalFailed: number;
  recentEmails: EmailQueue[];
}

export default function MailingService() {
  const [activeTab, setActiveTab] = useState("send");
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [queueItems, setQueueItems] = useState<EmailQueue[]>([]);
  const [stats, setStats] = useState<MailingStats | null>(null);

  // Send Email Form
  const [recipient, setRecipient] = useState("");
  const [recipientType, setRecipientType] = useState("single");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");

  // Template Form
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");

  useEffect(() => {
    fetchTemplates();
    fetchQueue();
    fetchStats();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/mail/templates");
      const data = await response.json();
      if (response.ok) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const fetchQueue = async () => {
    try {
      const response = await fetch("/api/mail/queue");
      const data = await response.json();
      if (response.ok) {
        setQueueItems(data.queue || []);
      }
    } catch (error) {
      console.error("Error fetching queue:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/mail/stats");
      const data = await response.json();
      if (response.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSendEmail = async () => {
    if (!recipient || !subject || !body) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient,
          recipientType,
          subject,
          body,
          scheduledAt: scheduleDate || null,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(scheduleDate ? "Email scheduled successfully" : "Email sent successfully");
        setRecipient("");
        setSubject("");
        setBody("");
        setScheduleDate("");
        fetchQueue();
        fetchStats();
      } else {
        toast.error(data.error || "Failed to send email");
      }
    } catch (error) {
      toast.error("Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName || !templateSubject || !templateBody) {
      toast.error("Please fill in all template fields");
      return;
    }

    setLoading(true);
    try {
      const url = editingTemplate 
        ? `/api/mail/templates` 
        : "/api/mail/templates";
      
      const response = await fetch(url, {
        method: editingTemplate ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTemplate?.id,
          name: templateName,
          subject: templateSubject,
          body: templateBody,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(editingTemplate ? "Template updated" : "Template created");
        setTemplateDialogOpen(false);
        resetTemplateForm();
        fetchTemplates();
      } else {
        toast.error(data.error || "Failed to save template");
      }
    } catch (error) {
      toast.error("Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await fetch(`/api/mail/templates?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Template deleted");
        fetchTemplates();
      } else {
        toast.error("Failed to delete template");
      }
    } catch (error) {
      toast.error("Failed to delete template");
    }
  };

  const handleLoadTemplate = (template: EmailTemplate) => {
    setSubject(template.subject);
    setBody(template.body);
    setSelectedTemplate(template.id);
    toast.success("Template loaded");
  };

  const resetTemplateForm = () => {
    setTemplateName("");
    setTemplateSubject("");
    setTemplateBody("");
    setEditingTemplate(null);
  };

  const editTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateSubject(template.subject);
    setTemplateBody(template.body);
    setTemplateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mailing Service</h1>
            <p className="text-muted-foreground text-sm">
              Send emails, manage templates, and track delivery
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSent}</div>
              <p className="text-xs text-muted-foreground">Successfully delivered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPending}</div>
              <p className="text-xs text-muted-foreground">In queue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFailed}</div>
              <p className="text-xs text-muted-foreground">Delivery errors</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="send">
            <Send className="h-4 w-4 mr-2" />
            Send Email
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="queue">
            <Inbox className="h-4 w-4 mr-2" />
            Queue
          </TabsTrigger>
        </TabsList>

        {/* Send Email Tab */}
        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compose Email</CardTitle>
              <CardDescription>Send email to users or groups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Recipient Type</Label>
                  <Select value={recipientType} onValueChange={setRecipientType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single User</SelectItem>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="role">By Role</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="recipient">
                    {recipientType === "single" ? "Email Address" : recipientType === "role" ? "Role Name" : "All Users"}
                  </Label>
                  <Input
                    id="recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder={recipientType === "single" ? "user@example.com" : recipientType === "role" ? "admin" : "Will send to all"}
                    disabled={recipientType === "all"}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Load Template (Optional)</Label>
                  <Select value={selectedTemplate} onValueChange={(value) => {
                    const template = templates.find(t => t.id === value);
                    if (template) handleLoadTemplate(template);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="body">Message *</Label>
                  <Textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Email body"
                    rows={8}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="schedule">Schedule (Optional)</Label>
                  <Input
                    id="schedule"
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleSendEmail} disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {scheduleDate ? "Schedule Email" : "Send Email"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {templates.length} template{templates.length !== 1 ? "s" : ""} available
            </p>
            <Dialog open={templateDialogOpen} onOpenChange={(open) => {
              setTemplateDialogOpen(open);
              if (!open) resetTemplateForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? "Edit Template" : "Create Template"}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Welcome Email"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="template-subject">Subject</Label>
                    <Input
                      id="template-subject"
                      value={templateSubject}
                      onChange={(e) => setTemplateSubject(e.target.value)}
                      placeholder="Welcome to our platform!"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="template-body">Body</Label>
                    <Textarea
                      id="template-body"
                      value={templateBody}
                      onChange={(e) => setTemplateBody(e.target.value)}
                      placeholder="Email body..."
                      rows={10}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveTemplate} disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="truncate">{template.subject}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {template.body}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => editTemplate(template)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveTab("send");
                        handleLoadTemplate(template);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Use
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Queue Tab */}
        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Queue</CardTitle>
              <CardDescription>Track scheduled and sent emails</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {queueItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No emails in queue</p>
                ) : (
                  queueItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.recipient}</p>
                          {item.status === "sent" && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {item.status === "pending" && <Clock className="h-4 w-4 text-yellow-500" />}
                          {item.status === "failed" && <XCircle className="h-4 w-4 text-red-500" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.subject}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.status === "sent" && item.sent_at
                            ? `Sent: ${new Date(item.sent_at).toLocaleString()}`
                            : `Scheduled: ${new Date(item.scheduled_at).toLocaleString()}`}
                        </p>
                        {item.error_message && (
                          <p className="text-xs text-red-500 mt-1">{item.error_message}</p>
                        )}
                      </div>
                      <div className="ml-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            item.status === "sent"
                              ? "bg-green-100 text-green-700"
                              : item.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
