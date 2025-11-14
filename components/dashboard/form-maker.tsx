"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Check,
  List as ListIcon,
  FileText,
  Hash
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

interface FormField {
  id: string;
  type: "text" | "email" | "password" | "number" | "textarea" | "date" | "checkbox" | "select";
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
}

export default function FormMaker() {
  const [forms, setForms] = useState<Form[]>([
    {
      id: "1",
      name: "Contact Form",
      description: "Basic contact form",
      fields: [
        { id: "1", type: "text", label: "Name", placeholder: "Enter your name", required: true },
        { id: "2", type: "email", label: "Email", placeholder: "your@email.com", required: true },
        { id: "3", type: "textarea", label: "Message", placeholder: "Your message...", required: true },
      ],
    },
  ]);

  const [currentForm, setCurrentForm] = useState<Form | null>(forms[0]);
  const [formName, setFormName] = useState(currentForm?.name || "");
  const [formDescription, setFormDescription] = useState(currentForm?.description || "");
  const [previewMode, setPreviewMode] = useState(false);

  const fieldTypes = [
    { type: "text", icon: Type, label: "Text Input" },
    { type: "email", icon: Mail, label: "Email" },
    { type: "password", icon: Lock, label: "Password" },
    { type: "number", icon: Hash, label: "Number" },
    { type: "textarea", icon: FileText, label: "Text Area" },
    { type: "date", icon: Calendar, label: "Date" },
    { type: "checkbox", icon: Check, label: "Checkbox" },
    { type: "select", icon: ListIcon, label: "Select" },
  ];

  const addField = (type: FormField["type"]) => {
    if (!currentForm) return;

    const newField: FormField = {
      id: Date.now().toString(),
      type,
      label: `New ${type} field`,
      placeholder: `Enter ${type}`,
      required: false,
      options: type === "select" ? ["Option 1", "Option 2"] : undefined,
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
      fields: currentForm.fields.map(field =>
        field.id === id ? { ...field, ...updates } : field
      ),
    });
  };

  const removeField = (id: string) => {
    if (!currentForm) return;

    setCurrentForm({
      ...currentForm,
      fields: currentForm.fields.filter(field => field.id !== id),
    });
  };

  const saveForm = () => {
    if (!currentForm) return;

    const updatedForm = {
      ...currentForm,
      name: formName,
      description: formDescription,
    };

    setForms(forms.map(f => f.id === currentForm.id ? updatedForm : f));
    setCurrentForm(updatedForm);
    toast.success("Form saved successfully!");
  };

  const createNewForm = () => {
    const newForm: Form = {
      id: Date.now().toString(),
      name: "New Form",
      description: "Form description",
      fields: [],
    };

    setForms([...forms, newForm]);
    setCurrentForm(newForm);
    setFormName(newForm.name);
    setFormDescription(newForm.description);
  };

  const renderFieldIcon = (type: string) => {
    const fieldType = fieldTypes.find(ft => ft.type === type);
    if (!fieldType) return null;
    const Icon = fieldType.icon;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Form Builder</h2>
            <p className="text-muted-foreground">Create and manage custom forms</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
              <Eye className="mr-2 h-4 w-4" />
              {previewMode ? "Edit" : "Preview"}
            </Button>
            <Button onClick={saveForm}>
              <Save className="mr-2 h-4 w-4" />
              Save Form
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Forms List */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Your Forms</CardTitle>
              <Button size="sm" onClick={createNewForm}>
                <Plus className="mr-2 h-4 w-4" />
                New Form
              </Button>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                {forms.map((form) => (
                  <button
                    key={form.id}
                    onClick={() => {
                      setCurrentForm(form);
                      setFormName(form.name);
                      setFormDescription(form.description);
                    }}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${currentForm?.id === form.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                      }`}
                  >
                    <p className="font-medium truncate">{form.name}</p>
                    <p className="text-xs opacity-80 truncate">{form.fields.length} fields</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form Editor/Preview */}
          <Card className="lg:col-span-6">
            <CardHeader>
              <div className="space-y-2">
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="text-lg font-semibold"
                  placeholder="Form Name"
                  disabled={previewMode}
                />
                <Input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Form Description"
                  disabled={previewMode}
                />
              </div>
            </CardHeader>
            <CardContent>
              {previewMode ? (
                /* Preview Mode */
                <div className="space-y-4">
                  {currentForm?.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label>
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {field.type === "textarea" ? (
                        <textarea
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          placeholder={field.placeholder}
                        />
                      ) : field.type === "checkbox" ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            id={`field-${field.id}`}
                            aria-label={field.label}
                          />
                          <span className="text-sm">{field.placeholder}</span>
                        </div>
                      ) : field.type === "select" ? (
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          aria-label={field.label}
                        >
                          <option value="">Select an option</option>
                          {field.options?.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <Input type={field.type} placeholder={field.placeholder} />
                      )}
                    </div>
                  ))}
                  {currentForm?.fields.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No fields added yet. Switch to edit mode to add fields.
                    </p>
                  )}
                  {currentForm && currentForm.fields.length > 0 && (
                    <Button className="w-full">Submit</Button>
                  )}
                </div>
              ) : (
                /* Edit Mode */
                <div className="space-y-3">
                  {currentForm?.fields.map((field) => (
                    <Card key={field.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move mt-1" />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              {renderFieldIcon(field.type)}
                              <Input
                                value={field.label}
                                onChange={(e) => updateField(field.id, { label: e.target.value })}
                                placeholder="Field Label"
                                className="font-medium"
                              />
                            </div>
                            <Input
                              value={field.placeholder}
                              onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                              placeholder="Placeholder text"
                            />
                            {field.type === "select" && (
                              <Input
                                value={field.options?.join(", ")}
                                onChange={(e) => updateField(field.id, {
                                  options: e.target.value.split(",").map(s => s.trim())
                                })}
                                placeholder="Options (comma separated)"
                              />
                            )}
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                  className="h-4 w-4"
                                />
                                Required
                              </label>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeField(field.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {currentForm?.fields.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No fields yet. Add fields from the panel on the right.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Field Types */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Add Fields</CardTitle>
              <CardDescription className="text-xs">Drag or click to add</CardDescription>
            </CardHeader>
            <CardContent className="p-2">
              <div className="grid grid-cols-2 gap-2">
                {fieldTypes.map((fieldType) => {
                  const Icon = fieldType.icon;
                  return (
                    <button
                      key={fieldType.type}
                      onClick={() => addField(fieldType.type as FormField["type"])}
                      disabled={previewMode}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs text-center">{fieldType.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Submissions</CardTitle>
            <CardDescription>Recent submissions to your forms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              No submissions yet
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
