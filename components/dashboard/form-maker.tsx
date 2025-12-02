import { useState } from "react";
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
} from "lucide-react";

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
  | "select";
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
        {
          id: "1",
          type: "text",
          label: "Name",
          placeholder: "Enter your name",
          required: true,
        },
        {
          id: "2",
          type: "email",
          label: "Email",
          placeholder: "your@email.com",
          required: true,
        },
        {
          id: "3",
          type: "textarea",
          label: "Message",
          placeholder: "Your message...",
          required: true,
        },
      ],
    },
  ]);

  const [currentForm, setCurrentForm] = useState<Form | null>(forms[0]);
  const [formName, setFormName] = useState(currentForm?.name || "");
  const [formDescription, setFormDescription] = useState(
    currentForm?.description || ""
  );
  const [previewMode, setPreviewMode] = useState(false);

  const fieldTypes = [
    { type: "text", icon: Type, label: "Text" },
    { type: "email", icon: Mail, label: "Email" },
    { type: "password", icon: Lock, label: "Password" },
    { type: "number", icon: Hash, label: "Number" },
    { type: "textarea", icon: FileText, label: "Textarea" },
    { type: "date", icon: Calendar, label: "Date" },
    { type: "checkbox", icon: CheckSquare, label: "Checkbox" },
    { type: "select", icon: List, label: "Select" },
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

  const saveForm = () => {
    if (!currentForm) return;
    const updated = {
      ...currentForm,
      name: formName,
      description: formDescription,
    };
    setForms(forms.map((f) => (f.id === updated.id ? updated : f)));
    setCurrentForm(updated);
    alert("Form saved successfully!");
  };

  const createNewForm = () => {
    const f: Form = {
      id: Date.now().toString(),
      name: "New Form",
      description: "Form description",
      fields: [],
    };
    setForms([...forms, f]);
    setCurrentForm(f);
    setFormName(f.name);
    setFormDescription(f.description);
  };

  const renderFieldIcon = (type: string) => {
    const ft = fieldTypes.find((x) => x.type === type);
    if (!ft) return null;
    const Icon = ft.icon;
    return <Icon className="w-4 h-4" />;
  };

  return (
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
                Create and manage forms
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
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
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-lg border border-border">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-card-foreground">
                    Forms
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
              <div className="p-2">
                {forms.map((form) => (
                  <button
                    key={form.id}
                    onClick={() => {
                      setCurrentForm(form);
                      setFormName(form.name);
                      setFormDescription(form.description);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${currentForm?.id === form.id
                      ? "bg-accent text-accent-foreground"
                      : "text-card-foreground hover:bg-muted"
                      }`}
                  >
                    <div className="font-medium">{form.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {form.fields.length} fields
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Field Types */}
            <div className="bg-card rounded-lg border border-border mt-4">
              <div className="p-4 border-b border-border">
                <h2 className="text-sm font-semibold text-card-foreground">
                  Field Types
                </h2>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                {fieldTypes.map((ft) => {
                  const Icon = ft.icon;
                  return (
                    <button
                      key={ft.type}
                      onClick={() => addField(ft.type as FormField["type"])}
                      disabled={previewMode}
                      className="flex flex-col items-center justify-center gap-2 p-3 rounded-md border border-border hover:border-primary hover:bg-accent transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs font-medium text-card-foreground">
                        {ft.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Editor */}
          <div className="col-span-9">
            <div className="bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-2xl font-semibold text-foreground bg-transparent border-0 outline-none focus:ring-0 p-0 mb-2 placeholder:text-muted-foreground"
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

              <div className="p-6">
                {previewMode ? (
                  <div className="max-w-2xl mx-auto space-y-6">
                    {currentForm?.fields.map((field) => (
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
                          />
                        ) : field.type === "checkbox" ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-primary border-border rounded focus:ring-ring"
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
                            type={field.type}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none text-foreground placeholder:text-muted-foreground"
                          />
                        )}
                      </div>
                    ))}

                    {!currentForm?.fields.length && (
                      <div className="text-center py-12 text-muted-foreground">
                        No fields added yet
                      </div>
                    )}

                    {currentForm?.fields.length ? (
                      <button className="w-full py-2.5 bg-primary hover:opacity-90 text-primary-foreground font-medium rounded-lg transition">
                        Submit
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentForm?.fields.map((field) => (
                      <div
                        key={field.id}
                        className="p-4 bg-muted border border-border rounded-lg hover:border-primary/50 transition"
                      >
                        <div className="flex gap-3">
                          <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5 cursor-move" />

                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              {renderFieldIcon(field.type)}
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
                              placeholder="Placeholder"
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

                          <button
                            onClick={() => removeField(field.id)}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition flex-shrink-0"
                            title="Remove field"
                            aria-label="Remove field"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {!currentForm?.fields.length && (
                      <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                        <p className="text-muted-foreground">No fields yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Add fields from the left panel
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Submissions */}
            <div className="bg-card rounded-lg border border-border mt-6">
              <div className="p-6 border-b border-border">
                <h2 className="text-base font-semibold text-card-foreground">
                  Submissions
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  View form responses
                </p>
              </div>
              <div className="p-12 text-center text-muted-foreground">
                No submissions yet
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
