"use client";
import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Save,
  Type,
  Mail,
  Lock,
  Calendar,
  CheckSquare,
  FileText,
  List,
  Hash,
  Edit2,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  Phone,
  Link,
  ToggleLeft,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "../ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";

interface FormField {
  id: string;
  type:
  | "text"
  | "email"
  | "password"
  | "number"
  | "textarea"
  | "date"
  | "checkbox"
  | "select"
  | "phone"
  | "url"
  | "time"
  | "toggle";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface Form {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Submission {
  id: string;
  form_id: string;
  data: Record<string, unknown>;
  submitted_at: string;
  users?: {
    id: string;
    display_name: string;
    email: string;
  };
}

export default function FormMaker() {
  const [forms, setForms] = useState<Form[]>([]);
  const [currentForm, setCurrentForm] = useState<Form | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [previewFormData, setPreviewFormData] = useState<Record<string, unknown>>({});
  const [submittingPreview, setSubmittingPreview] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const fieldTypes = [
    { type: "text", icon: Type, label: "Text" },
    { type: "email", icon: Mail, label: "Email" },
    { type: "password", icon: Lock, label: "Password" },
    { type: "number", icon: Hash, label: "Number" },
    { type: "textarea", icon: FileText, label: "Textarea" },
    { type: "date", icon: Calendar, label: "Date" },
    { type: "time", icon: Clock, label: "Time" },
    { type: "checkbox", icon: CheckSquare, label: "Checkbox" },
    { type: "select", icon: List, label: "Select" },
    { type: "phone", icon: Phone, label: "Phone" },
    { type: "url", icon: Link, label: "URL" },
    { type: "toggle", icon: ToggleLeft, label: "Toggle" },
  ];

  useEffect(() => {
    fetchForms();
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserId(user.id);
      } catch {
        // Ignore
      }
    }
  }, []);

  useEffect(() => {
    if (currentForm?.id && currentForm.created_at) {
      fetchSubmissions(currentForm.id);
    }
  }, [currentForm?.id]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/forms");
      const data = await response.json();

      if (response.ok && data.forms) {
        setForms(data.forms);
        if (data.forms.length > 0 && !currentForm) {
          const form = data.forms[0];
          setCurrentForm(form);
          setFormName(form.name);
          setFormDescription(form.description || "");
        }
      }
    } catch (error) {
      console.error("Failed to fetch forms:", error);
      toast.error("Failed to load forms");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (formId: string) => {
    try {
      setLoadingSubmissions(true);
      const response = await fetch(`/api/forms/submit?formId=${formId}`);
      const data = await response.json();

      if (response.ok && data.submissions) {
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const addField = (type: FormField["type"]) => {
    if (!currentForm) return;
    const newField: FormField = {
      id: Date.now().toString(),
      type,
      label: `New ${type} field`,
      placeholder: type === "checkbox" || type === "toggle" ? "Check this option" : `Enter ${type}`,
      required: false,
      options: type === "select" ? ["Option 1", "Option 2", "Option 3"] : undefined,
    };
    setCurrentForm({
      ...currentForm,
      fields: [...currentForm.fields, newField],
    });
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    if (!currentForm) return;
    setCurrentForm({
      ...currentForm,
      fields: currentForm.fields.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    });
  };

  const removeField = (id: string) => {
    if (!currentForm) return;
    setCurrentForm({
      ...currentForm,
      fields: currentForm.fields.filter((f) => f.id !== id),
    });
  };

  const moveField = (id: string, direction: "up" | "down") => {
    if (!currentForm) return;
    const index = currentForm.fields.findIndex((f) => f.id === id);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentForm.fields.length) return;

    const newFields = [...currentForm.fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];

    setCurrentForm({
      ...currentForm,
      fields: newFields,
    });
  };

  const duplicateField = (id: string) => {
    if (!currentForm) return;
    const field = currentForm.fields.find((f) => f.id === id);
    if (!field) return;

    const newField: FormField = {
      ...field,
      id: Date.now().toString(),
      label: `${field.label} (copy)`,
    };

    const index = currentForm.fields.findIndex((f) => f.id === id);
    const newFields = [...currentForm.fields];
    newFields.splice(index + 1, 0, newField);

    setCurrentForm({
      ...currentForm,
      fields: newFields,
    });
  };

  const saveForm = async () => {
    if (!currentForm) return;

    setSaving(true);
    try {
      const isNew = !currentForm.created_at;
      const url = "/api/forms";
      const method = isNew ? "POST" : "PATCH";

      const body = isNew
        ? {
          name: formName,
          description: formDescription,
          fields: currentForm.fields,
          createdBy: userId,
        }
        : {
          formId: currentForm.id,
          name: formName,
          description: formDescription,
          fields: currentForm.fields,
        };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.form) {
        toast.success(isNew ? "Form created!" : "Form saved!");

        if (isNew) {
          setForms([data.form, ...forms]);
        } else {
          setForms(forms.map((f) => (f.id === data.form.id ? data.form : f)));
        }
        setCurrentForm(data.form);
      } else {
        toast.error(data.error || "Failed to save form");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save form");
    } finally {
      setSaving(false);
    }
  };

  const deleteForm = async (formId: string) => {
    if (!confirm("Are you sure you want to delete this form? All submissions will be lost.")) {
      return;
    }

    try {
      const response = await fetch(`/api/forms?formId=${formId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Form deleted!");
        const remainingForms = forms.filter((f) => f.id !== formId);
        setForms(remainingForms);
        if (currentForm?.id === formId) {
          if (remainingForms.length > 0) {
            setCurrentForm(remainingForms[0]);
            setFormName(remainingForms[0].name);
            setFormDescription(remainingForms[0].description || "");
          } else {
            setCurrentForm(null);
            setFormName("");
            setFormDescription("");
          }
        }
      } else {
        toast.error("Failed to delete form");
      }
    } catch {
      toast.error("Failed to delete form");
    }
  };

  const createNewForm = () => {
    const f: Form = {
      id: `temp-${Date.now()}`,
      name: "New Form",
      description: "Form description",
      fields: [],
    };
    setCurrentForm(f);
    setFormName(f.name);
    setFormDescription(f.description);
    setSubmissions([]);
  };

  const handlePreviewSubmit = async () => {
    if (!currentForm) return;

    for (const field of currentForm.fields) {
      if (field.required && !previewFormData[field.id]) {
        toast.error(`${field.label} is required`);
        return;
      }
    }

    if (currentForm.created_at) {
      setSubmittingPreview(true);
      try {
        const response = await fetch("/api/forms/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formId: currentForm.id,
            data: previewFormData,
            submittedBy: userId,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success("Form submitted successfully!");
          setPreviewFormData({});
          fetchSubmissions(currentForm.id);
        } else {
          toast.error(data.error || "Failed to submit form");
        }
      } catch {
        toast.error("Failed to submit form");
      } finally {
        setSubmittingPreview(false);
      }
    } else {
      toast.success("Form preview submitted! (Save form to enable real submissions)");
      setPreviewFormData({});
    }
  };

  const deleteSubmission = async (submissionId: string) => {
    if (!confirm("Delete this submission?")) return;

    try {
      const response = await fetch(`/api/forms/submit?submissionId=${submissionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Submission deleted");
        setSubmissions(submissions.filter((s) => s.id !== submissionId));
        setShowSubmissionModal(false);
      } else {
        toast.error("Failed to delete submission");
      }
    } catch {
      toast.error("Failed to delete submission");
    }
  };

  const exportSubmissions = () => {
    if (!currentForm || submissions.length === 0) return;

    const headers = currentForm.fields.map((f) => f.label);
    const rows = submissions.map((s) =>
      currentForm.fields.map((f) => String(s.data[f.id] || ""))
    );

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentForm.name.replace(/\s+/g, "_")}_submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyFormLink = () => {
    if (!currentForm?.created_at) {
      toast.error("Save the form first to get a shareable link");
      return;
    }
    const link = `${window.location.origin}/forms/${currentForm.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Form link copied to clipboard!");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderFieldIcon = (type: string) => {
    const ft = fieldTypes.find((x) => x.type === type);
    if (!ft) return null;
    const Icon = ft.icon;
    return <Icon className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                  Form Builder
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Create and manage forms with drag-and-drop
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto flex-wrap">
                <button
                  onClick={copyFormLink}
                  className="px-3 py-2 text-xs sm:text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-accent transition flex items-center gap-2"
                  title="Copy form link"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-accent transition flex items-center justify-center gap-2"
                >
                  {previewMode ? (
                    <Edit2 className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  {previewMode ? "Edit" : "Preview"}
                </button>
                <button
                  onClick={saveForm}
                  disabled={saving}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-3 space-y-4">
              {/* Forms List */}
              <div className="bg-card rounded-lg border border-border">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-card-foreground">
                      My Forms
                    </h2>
                    <button
                      onClick={createNewForm}
                      className="p-1.5 text-primary hover:bg-accent rounded transition"
                      title="Create new form"
                      aria-label="Create new form"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-2 max-h-64 overflow-y-auto">
                  {forms.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No forms yet. Create one!
                    </p>
                  ) : (
                    forms.map((form) => (
                      <div
                        key={form.id}
                        className={`group flex items-center justify-between px-3 py-2 rounded-md text-sm transition cursor-pointer ${currentForm?.id === form.id
                            ? "bg-accent text-accent-foreground"
                            : "text-card-foreground hover:bg-muted"
                          }`}
                        onClick={() => {
                          setCurrentForm(form);
                          setFormName(form.name);
                          setFormDescription(form.description || "");
                          setPreviewFormData({});
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{form.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {form.fields?.length || 0} fields
                          </div>
                        </div>
                        {form.created_at && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteForm(form.id);
                            }}
                            className="p-1 text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition"
                            title="Delete form"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Field Types */}
              <div className="bg-card rounded-lg border border-border">
                <div className="p-4 border-b border-border">
                  <h2 className="text-sm font-semibold text-card-foreground">
                    Field Types
                  </h2>
                </div>
                <div className="p-3 grid grid-cols-3 lg:grid-cols-2 gap-2">
                  {fieldTypes.map((ft) => {
                    const Icon = ft.icon;
                    return (
                      <button
                        key={ft.type}
                        onClick={() => addField(ft.type as FormField["type"])}
                        disabled={previewMode}
                        className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-md border border-border hover:border-primary hover:bg-accent transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-[10px] sm:text-xs font-medium text-card-foreground">
                          {ft.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Main Editor */}
            <div className="lg:col-span-9 space-y-6">
              {currentForm ? (
                <>
                  {/* Form Editor */}
                  <div className="bg-card rounded-lg border border-border">
                    <div className="p-4 sm:p-6 border-b border-border">
                      <input
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full text-xl sm:text-2xl font-semibold text-foreground bg-transparent border-0 outline-none focus:ring-0 p-0 mb-2 placeholder:text-muted-foreground"
                        disabled={previewMode}
                        placeholder="Form Name"
                      />
                      <input
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        className="w-full text-sm text-muted-foreground bg-transparent border-0 outline-none focus:ring-0 p-0 placeholder:text-muted-foreground"
                        disabled={previewMode}
                        placeholder="Add a description"
                      />
                    </div>

                    <div className="p-4 sm:p-6">
                      {previewMode ? (
                        /* Preview Mode */
                        <div className="max-w-2xl mx-auto space-y-6">
                          {currentForm.fields.map((field) => (
                            <div key={field.id}>
                              <label className="block text-sm font-medium text-foreground mb-2">
                                {field.label}
                                {field.required && (
                                  <span className="text-destructive ml-1">*</span>
                                )}
                              </label>

                              {field.type === "textarea" ? (
                                <textarea
                                  className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none resize-none text-foreground placeholder:text-muted-foreground"
                                  rows={4}
                                  placeholder={field.placeholder}
                                  value={String(previewFormData[field.id] || "")}
                                  onChange={(e) =>
                                    setPreviewFormData({
                                      ...previewFormData,
                                      [field.id]: e.target.value,
                                    })
                                  }
                                />
                              ) : field.type === "checkbox" || field.type === "toggle" ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 text-primary border-border rounded focus:ring-ring"
                                    checked={Boolean(previewFormData[field.id]) || false}
                                    onChange={(e) =>
                                      setPreviewFormData({
                                        ...previewFormData,
                                        [field.id]: e.target.checked,
                                      })
                                    }
                                    aria-label={field.label || "Checkbox option"}
                                    title={field.label || "Checkbox option"}
                                  />
                                  <span className="text-sm text-foreground">
                                    {field.placeholder}
                                  </span>
                                </div>
                              ) : field.type === "select" ? (
                                <select
                                  className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none text-foreground"
                                  aria-label={field.label || "Select option"}
                                  value={String(previewFormData[field.id] || "")}
                                  onChange={(e) =>
                                    setPreviewFormData({
                                      ...previewFormData,
                                      [field.id]: e.target.value,
                                    })
                                  }
                                >
                                  <option value="">Select...</option>
                                  {field.options?.map((o, i) => (
                                    <option value={o} key={i}>
                                      {o}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={field.type === "phone" ? "tel" : field.type}
                                  placeholder={field.placeholder}
                                  className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none text-foreground placeholder:text-muted-foreground"
                                  value={String(previewFormData[field.id] || "")}
                                  onChange={(e) =>
                                    setPreviewFormData({
                                      ...previewFormData,
                                      [field.id]: e.target.value,
                                    })
                                  }
                                />
                              )}
                            </div>
                          ))}

                          {!currentForm.fields.length && (
                            <div className="text-center py-12 text-muted-foreground">
                              No fields added yet
                            </div>
                          )}

                          {currentForm.fields.length > 0 && (
                            <button
                              onClick={handlePreviewSubmit}
                              disabled={submittingPreview}
                              className="w-full py-2.5 bg-primary hover:opacity-90 text-primary-foreground font-medium rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {submittingPreview && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              )}
                              Submit
                            </button>
                          )}
                        </div>
                      ) : (
                        /* Edit Mode */
                        <div className="space-y-4">
                          {currentForm.fields.map((field, index) => (
                            <div
                              key={field.id}
                              className="p-4 bg-muted border border-border rounded-lg hover:border-primary/50 transition group"
                            >
                              <div className="flex gap-3">
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => moveField(field.id, "up")}
                                    disabled={index === 0}
                                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition"
                                    title="Move up"
                                  >
                                    <GripVertical className="w-4 h-4 rotate-180" />
                                  </button>
                                  <button
                                    onClick={() => moveField(field.id, "down")}
                                    disabled={index === currentForm.fields.length - 1}
                                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition"
                                    title="Move down"
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="flex-1 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="gap-1">
                                      {renderFieldIcon(field.type)}
                                      {field.type}
                                    </Badge>
                                    <input
                                      value={field.label}
                                      onChange={(e) =>
                                        updateField(field.id, {
                                          label: e.target.value,
                                        })
                                      }
                                      className="flex-1 px-3 py-1.5 text-sm bg-input border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent outline-none text-foreground placeholder:text-muted-foreground"
                                      placeholder="Label"
                                    />
                                  </div>

                                  {field.type === "select" && (
                                    <input
                                      value={field.options?.join(", ")}
                                      onChange={(e) =>
                                        updateField(field.id, {
                                          options: e.target.value
                                            .split(",")
                                            .map((s) => s.trim()),
                                        })
                                      }
                                      className="w-full px-3 py-1.5 text-sm bg-input border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent outline-none text-foreground placeholder:text-muted-foreground"
                                      placeholder="Options (comma separated)"
                                    />
                                  )}

                                  <input
                                    value={field.placeholder}
                                    onChange={(e) =>
                                      updateField(field.id, {
                                        placeholder: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-1.5 text-sm bg-input border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent outline-none text-foreground placeholder:text-muted-foreground"
                                    placeholder="Placeholder text"
                                  />

                                  <label className="flex items-center gap-2 text-sm text-foreground">
                                    <input
                                      type="checkbox"
                                      checked={field.required}
                                      onChange={(e) =>
                                        updateField(field.id, {
                                          required: e.target.checked,
                                        })
                                      }
                                      className="w-4 h-4 text-primary border-border rounded focus:ring-ring"
                                    />
                                    Required
                                  </label>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => duplicateField(field.id)}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition"
                                    title="Duplicate field"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => removeField(field.id)}
                                    className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition"
                                    title="Remove field"
                                    aria-label="Remove field"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}

                          {!currentForm.fields.length && (
                            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                              <p className="text-muted-foreground">No fields yet</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Click on field types in the sidebar to add fields
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submissions */}
                  <div className="bg-card rounded-lg border border-border">
                    <div className="p-4 sm:p-6 border-b border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-base font-semibold text-card-foreground">
                            Submissions
                          </h2>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {submissions.length} response{submissions.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => currentForm && fetchSubmissions(currentForm.id)}
                            disabled={loadingSubmissions}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition"
                            title="Refresh"
                          >
                            <RefreshCw className={`w-4 h-4 ${loadingSubmissions ? "animate-spin" : ""}`} />
                          </button>
                          {submissions.length > 0 && (
                            <button
                              onClick={exportSubmissions}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition"
                              title="Export CSV"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {loadingSubmissions ? (
                      <div className="p-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                      </div>
                    ) : submissions.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground">
                        No submissions yet
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                #
                              </th>
                              {currentForm.fields.slice(0, 3).map((field) => (
                                <th
                                  key={field.id}
                                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                                >
                                  {field.label}
                                </th>
                              ))}
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Submitted
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {submissions.map((sub, idx) => (
                              <tr
                                key={sub.id}
                                className="hover:bg-muted/50 transition cursor-pointer"
                                onClick={() => {
                                  setSelectedSubmission(sub);
                                  setShowSubmissionModal(true);
                                }}
                              >
                                <td className="px-4 py-3 text-sm text-foreground">
                                  {idx + 1}
                                </td>
                                {currentForm.fields.slice(0, 3).map((field) => (
                                  <td
                                    key={field.id}
                                    className="px-4 py-3 text-sm text-foreground max-w-[200px] truncate"
                                  >
                                    {typeof sub.data[field.id] === "boolean"
                                      ? sub.data[field.id]
                                        ? "Yes"
                                        : "No"
                                      : String(sub.data[field.id] || "-")}
                                  </td>
                                ))}
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                  {formatDate(sub.submitted_at)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteSubmission(sub.id);
                                    }}
                                    className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-card rounded-lg border border-border p-12 text-center">
                  <p className="text-muted-foreground">
                    Select a form or create a new one
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submission Detail Modal */}
      <Dialog open={showSubmissionModal} onOpenChange={setShowSubmissionModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              Submitted on{" "}
              {selectedSubmission && formatDate(selectedSubmission.submitted_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && currentForm && (
            <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto">
              {currentForm.fields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <label className="text-sm font-medium text-foreground">
                    {field.label}
                  </label>
                  <div className="px-3 py-2 bg-muted rounded-md text-sm text-foreground">
                    {typeof selectedSubmission.data[field.id] === "boolean"
                      ? selectedSubmission.data[field.id]
                        ? "Yes"
                        : "No"
                      : String(selectedSubmission.data[field.id] || "-")}
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  onClick={() => setShowSubmissionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-accent transition"
                >
                  Close
                </button>
                <button
                  onClick={() => deleteSubmission(selectedSubmission.id)}
                  className="px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive rounded-lg hover:opacity-90 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
