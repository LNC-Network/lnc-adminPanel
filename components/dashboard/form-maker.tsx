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
  Check,
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
    { type: "textarea", icon: FileText, label: "Text Area" },
    { type: "date", icon: Calendar, label: "Date" },
    { type: "checkbox", icon: Check, label: "Checkbox" },
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
    return <Icon className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Form Builder</h1>
            <p className="text-slate-600 mt-1">
              Create and customize forms with ease
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save Form
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Sidebar - Form List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h2 className="font-semibold text-slate-900 mb-3">
                  Your Forms
                </h2>
                <button
                  onClick={createNewForm}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Form
                </button>
              </div>
              <div className="p-2 space-y-1">
                {forms.map((form) => (
                  <button
                    key={form.id}
                    onClick={() => {
                      setCurrentForm(form);
                      setFormName(form.name);
                      setFormDescription(form.description);
                    }}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-all ${
                      currentForm?.id === form.id
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <p className="font-medium truncate">{form.name}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {form.fields.length} fields
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Editor */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200 space-y-3">
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-xl font-semibold text-slate-900 border-b-2 border-transparent hover:border-slate-200 focus:border-blue-500 outline-none px-2 py-1 transition-colors"
                  disabled={previewMode}
                  placeholder="Form Name"
                />
                <input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full text-slate-600 border-b-2 border-transparent hover:border-slate-200 focus:border-blue-500 outline-none px-2 py-1 transition-colors"
                  disabled={previewMode}
                  placeholder="Form Description"
                />
              </div>

              <div className="p-6">
                {previewMode ? (
                  <div className="space-y-5">
                    {currentForm?.fields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                          {field.label}
                          {field.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>

                        {field.type === "textarea" ? (
                          <textarea
                            className="w-full min-h-[100px] rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 py-2 text-sm outline-none transition-all"
                            placeholder={field.placeholder}
                          />
                        ) : field.type === "checkbox" ? (
                          <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            {field.placeholder}
                          </label>
                        ) : field.type === "select" ? (
                          <select className="w-full h-10 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 text-sm outline-none transition-all">
                            <option value="">Select an option...</option>
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
                            className="w-full h-10 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 text-sm outline-none transition-all"
                          />
                        )}
                      </div>
                    ))}

                    {!currentForm?.fields.length && (
                      <div className="text-center py-12">
                        <p className="text-slate-400">No fields added yet</p>
                        <p className="text-sm text-slate-400 mt-1">
                          Exit preview mode to add fields
                        </p>
                      </div>
                    )}

                    {currentForm?.fields.length ? (
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors mt-6">
                        Submit Form
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentForm?.fields.map((field) => (
                      <div
                        key={field.id}
                        className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <GripVertical className="w-5 h-5 text-slate-400 mt-2 cursor-move" />
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
                                className="flex-1 h-9 px-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
                                placeholder="Field Label"
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
                                className="w-full h-9 px-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
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
                              className="w-full h-9 px-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
                              placeholder="Placeholder text"
                            />

                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) =>
                                  updateField(field.id, {
                                    required: e.target.checked,
                                  })
                                }
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              Required field
                            </label>
                          </div>

                          <button
                            onClick={() => removeField(field.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {!currentForm?.fields.length && (
                      <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
                        <p className="text-slate-400">No fields yet</p>
                        <p className="text-sm text-slate-400 mt-1">
                          Add fields from the panel on the right
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Field Types Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h2 className="font-semibold text-slate-900">Add Fields</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Click to add to form
                </p>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-2 gap-2">
                  {fieldTypes.map((ft) => {
                    const Icon = ft.icon;
                    return (
                      <button
                        key={ft.type}
                        onClick={() => addField(ft.type as FormField["type"])}
                        disabled={previewMode}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icon className="w-5 h-5 text-slate-600" />
                        <span className="text-xs text-slate-700 text-center font-medium">
                          {ft.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submissions Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Form Submissions
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              View and manage form responses
            </p>
          </div>
          <div className="p-12 text-center">
            <p className="text-slate-400">No submissions yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Submissions will appear here once users fill out your form
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
