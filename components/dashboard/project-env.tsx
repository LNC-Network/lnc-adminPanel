"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Lock,
  Unlock,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  FolderLock,
  Key,
  Shield,
  AlertCircle,
  Check,
} from "lucide-react";

// Improved ProjectEnv component implementing suggestions from review

interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
  created_by: number;
}

interface Credential {
  id: number;
  key: string;
  value: string;
  description: string;
  created_at: string;
  created_by: number;
}

interface ProjectEnvProps {
  userRole: string;
}

// Small helpers
const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString() : "-";

function ProjectSkeleton() {
  return (
    <div className="animate-pulse space-y-2 p-4 border rounded-lg">
      <div className="h-6 w-3/4 bg-surface rounded" />
      <div className="h-4 w-1/2 bg-surface rounded" />
    </div>
  );
}

function generatePassword(length = 24) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let out = "";
  for (let i = 0; i < length; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function ProjectEnv({ userRole }: ProjectEnvProps) {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showNewCredentialDialog, setShowNewCredentialDialog] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<{
    type: "project" | "credential";
    id: number | null;
    name?: string;
  } | null>(null);
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [visibleValues, setVisibleValues] = useState<Set<number>>(new Set());
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchRef = useRef<number | null>(null);
  const [undoStack, setUndoStack] = useState<any[]>([]);

  // New project form
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    password: "",
  });

  // New credential form
  const [newCredential, setNewCredential] = useState({
    key: "",
    value: "",
    description: "",
  });

  const canManageProjects = ["dev_admin", "super admin"].includes(userRole);
  const canViewProjects = ["dev_member", "dev_admin", "super admin"].includes(
    userRole
  );

  // Debounce search input
  useEffect(() => {
    if (searchRef.current) window.clearTimeout(searchRef.current);
    searchRef.current = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      300
    );
    return () => {
      if (searchRef.current) window.clearTimeout(searchRef.current);
    };
  }, [search]);

  useEffect(() => {
    if (canViewProjects) fetchProjects();
    // clear on unmount
    return () => {
      setCredentials([]);
      setVisibleValues(new Set());
      setPassword("");
      setIsUnlocked(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewProjects]);

  // Auto-lock on inactivity
  useEffect(() => {
    if (!selectedProject || !isUnlocked) return;
    let timer: number;
    function reset() {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setIsUnlocked(false);
        setCredentials([]);
        setVisibleValues(new Set());
        toast("Session locked due to inactivity");
      }, 5 * 60 * 1000);
    }
    ["mousemove", "keydown", "click", "touchstart"].forEach((e) =>
      window.addEventListener(e, reset)
    );
    reset();
    return () => {
      window.clearTimeout(timer);
      ["mousemove", "keydown", "click", "touchstart"].forEach((e) =>
        window.removeEventListener(e, reset)
      );
    };
  }, [selectedProject, isUnlocked]);

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects || []);
      } else {
        toast.error(data.error || "Failed to fetch projects");
        setProjects([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load projects");
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const fetchCredentials = useCallback(async (projectId: number) => {
    setLoadingCredentials(true);
    try {
      const res = await fetch(
        `/api/projects/credentials?projectId=${projectId}`
      );
      const data = await res.json();
      if (res.ok) {
        setCredentials(data.credentials || []);
      } else {
        toast.error(data.error || "Failed to fetch credentials");
        setCredentials([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load credentials");
      setCredentials([]);
    } finally {
      setLoadingCredentials(false);
    }
  }, []);

  const handleProjectClick = useCallback((project: Project) => {
    setSelectedProject(project);
    setShowPasswordDialog(true);
    setPassword("");
    setIsUnlocked(false);
  }, []);

  const verifyPassword = useCallback(async () => {
    if (!selectedProject || !password) {
      toast.error("Please enter password");
      return;
    }
    try {
      const res = await fetch("/api/projects/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProject.id, password }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setIsUnlocked(true);
        setShowPasswordDialog(false);
        await fetchCredentials(selectedProject.id);
        toast.success("Project unlocked successfully");
      } else {
        toast.error("Incorrect password");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to verify password");
    }
  }, [selectedProject, password, fetchCredentials]);

  const createProject = useCallback(async () => {
    if (!newProject.name || !newProject.password) {
      toast.error("Name and password are required");
      return;
    }
    try {
      // optimistic UI: add temporary project locally
      const tempId = Date.now() * -1;
      const tempProject: Project = {
        id: tempId,
        name: newProject.name,
        description: newProject.description,
        created_at: new Date().toISOString(),
        created_by: 0,
      };
      setProjects((p) => (p ? [tempProject, ...p] : [tempProject]));
      setShowNewProjectDialog(false);
      setNewProject({ name: "", description: "", password: "" });

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });
      const data = await res.json();
      if (res.ok) {
        // replace temp with real
        setProjects(
          (p) =>
            p?.map((x) => (x.id === tempId ? data.project : x)) ?? [
              data.project,
            ]
        );
        toast.success("Project created successfully");
      } else {
        // rollback
        setProjects((p) => p?.filter((x) => x.id !== tempId) ?? []);
        toast.error(data.error || "Failed to create project");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create project");
    }
  }, [newProject]);

  const requestDelete = useCallback(
    (type: "project" | "credential", id: number, name?: string) => {
      setShowConfirmDelete({ type, id, name });
    },
    []
  );

  const deleteProject = useCallback(
    async (projectId: number) => {
      setShowConfirmDelete(null);
      // optimistic removal with undo
      const previous = projects;
      setProjects((p) => p?.filter((x) => x.id !== projectId) ?? []);
      setUndoStack((u) => [
        ...u,
        {
          kind: "deleteProject",
          id: projectId,
          previous,
          timeout: window.setTimeout(async () => {
            try {
              await fetch(`/api/projects?id=${projectId}`, {
                method: "DELETE",
              });
              // no-op: already removed
            } catch (err) {
              console.error(err);
            }
          }, 5000),
        },
      ]);
      toast("Project deleted. Undo?", {
        action: { label: "Undo", onClick: () => undoLast() },
      });
    },
    [projects]
  );

  const undoLast = useCallback(() => {
    const last = undoStack.pop();
    if (!last) return;
    if (last.timeout) window.clearTimeout(last.timeout);
    if (last.kind === "deleteProject") {
      setProjects(last.previous || []);
      toast.success("Undo successful");
    }
    setUndoStack([...undoStack]);
  }, [undoStack]);

  const deleteCredential = useCallback(
    async (credentialId: number) => {
      setShowConfirmDelete(null);
      if (!selectedProject) return;
      const prev = credentials;
      setCredentials((c) => c.filter((x) => x.id !== credentialId));
      setUndoStack((u) => [
        ...u,
        {
          kind: "deleteCredential",
          id: credentialId,
          previous: prev,
          timeout: window.setTimeout(async () => {
            try {
              await fetch(`/api/projects/credentials?id=${credentialId}`, {
                method: "DELETE",
              });
            } catch (err) {
              console.error(err);
            }
          }, 5000),
        },
      ]);
      toast("Credential deleted. Undo?", {
        action: { label: "Undo", onClick: () => undoLast() },
      });
    },
    [credentials, selectedProject, undoLast]
  );

  const addCredential = useCallback(async () => {
    if (!selectedProject || !newCredential.key || !newCredential.value) {
      toast.error("Key and value are required");
      return;
    }
    try {
      const tempId = Date.now() * -1;
      const temp: Credential = {
        id: tempId,
        key: newCredential.key,
        value: newCredential.value,
        description: newCredential.description,
        created_at: new Date().toISOString(),
        created_by: 0,
      };
      setCredentials((c) => [temp, ...c]);
      setShowNewCredentialDialog(false);
      setNewCredential({ key: "", value: "", description: "" });

      const res = await fetch("/api/projects/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject.id,
          ...newCredential,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCredentials((c) =>
          c.map((x) => (x.id === tempId ? data.credential : x))
        );
        toast.success("Credential added successfully");
      } else {
        setCredentials((c) => c.filter((x) => x.id !== tempId));
        toast.error(data.error || "Failed to add credential");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add credential");
    }
  }, [newCredential, selectedProject]);

  const toggleValueVisibility = useCallback((id: number) => {
    setVisibleValues((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
    // auto-hide after 8s
    setTimeout(
      () =>
        setVisibleValues((p) => {
          const n = new Set(p);
          n.delete(id);
          return n;
        }),
      8000
    );
  }, []);

  const copyToClipboard = useCallback(async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((v) => (v === id ? null : v)), 1500);
      toast.success("Copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy");
    }
  }, []);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (!debouncedSearch) return projects;
    const q = debouncedSearch.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
    );
  }, [projects, debouncedSearch]);

  // Accessibility: focus management when dialogs open
  const passwordDialogRef = useRef<HTMLDivElement | null>(null);

  // UI
  if (!canViewProjects) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">
            This feature is only available to dev team members.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left column - sidebar */}
      <aside className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <FolderLock className="h-5 w-5" /> Projects
            </h1>
          </div>
          {canManageProjects && (
            <Button
              size="sm"
              onClick={() => setShowNewProjectDialog(true)}
              aria-label="Create new project"
            >
              <Plus className="h-4 w-4 mr-2" /> New
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search projects"
          />
        </div>

        <div className="space-y-2 overflow-y-auto max-h-[60vh]">
          {loadingProjects && (
            <div className="space-y-2">
              <ProjectSkeleton />
              <ProjectSkeleton />
              <ProjectSkeleton />
            </div>
          )}

          {!loadingProjects && filteredProjects.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No projects found. Create one to get started.
            </div>
          )}

          {!loadingProjects &&
            filteredProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectClick(project)}
                className={`w-full text-left p-3 rounded-xl bg-muted transition flex items-start justify-between ${
                  selectedProject?.id === project.id && isUnlocked
                    ? "border-primary bg-primary/5"
                    : "hover:shadow-sm"
                }`}
                aria-pressed={selectedProject?.id === project.id && isUnlocked}
                aria-label={`Open project ${project.name}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {selectedProject?.id === project.id && isUnlocked ? (
                      <Unlock className="h-4 w-4 text-green-500" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    <div className="truncate font-medium">{project.name}</div>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {project.description || "No description"}
                  </div>
                </div>
                <div className="ml-3 text-xs text-muted-foreground">
                  {new Date(project.created_at).toLocaleDateString()}
                </div>
              </button>
            ))}
        </div>
      </aside>

      {/* Right column - details */}
      <main className="lg:col-span-3 space-y-6">
        {!selectedProject && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" /> Vault Overview
              </CardTitle>
              <CardDescription>
                Choose a project to view credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded bg-muted">
                  <h3 className="font-medium">Quick actions</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a project or learn about access controls.
                  </p>
                </div>
                <div className="p-4 rounded bg-muted">
                  <h3 className="font-medium">Security</h3>
                  <p className="text-sm text-muted-foreground">
                    Auto-lock after inactivity, masked secrets, and undo for
                    deletes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedProject && (
          <Card className="rounded-xl p-3 border border-muted/30 bg-muted/10 hover:bg-muted/20 transition-colors">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center mb-2">
                  {selectedProject.name} credentials
                </CardTitle>
                <CardDescription>
                  {selectedProject.description ||
                    "Environment variables and API keys"}
                </CardDescription>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setShowNewCredentialDialog(true)}
                  className="flex-1 sm:flex-none"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsUnlocked(false);
                    setSelectedProject(null);
                    setCredentials([]);
                  }}
                  className="flex-1 sm:flex-none"
                >
                  <Lock className="h-4 w-4 mr-1" /> Lock
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!isUnlocked && (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    This project is locked. Enter password to view credentials.
                  </p>
                  <div className="mt-4 flex justify-center">
                    <Button onClick={() => setShowPasswordDialog(true)}>
                      <Unlock className="h-4 w-4 mr-2" /> Unlock
                    </Button>
                    {canManageProjects && (
                      <Button
                        variant="ghost"
                        className="ml-2"
                        onClick={() =>
                          requestDelete(
                            "project",
                            selectedProject.id,
                            selectedProject.name
                          )
                        }
                        aria-label={`Delete project ${selectedProject.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Improved, cleaner layout for the provided block */}
              {/* Improved, cleaner layout for the provided block */}
              {isUnlocked && (
                <div className="space-y-4">
                  {loadingCredentials && (
                    <div className="space-y-2">
                      <ProjectSkeleton />
                      <ProjectSkeleton />
                    </div>
                  )}

                  {!loadingCredentials && credentials.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No credentials added yet</p>
                    </div>
                  )}

                  {!loadingCredentials &&
                    credentials.map((cred) => (
                      <Card
                        key={cred.id}
                        className="rounded-2xl p-4 border border-muted/30 bg-muted/5 flex flex-col gap-4"
                      >
                        {/* TOP ROW */}
                        <div className="flex items-start gap-4 w-full">
                          {/* KEY FIELD */}
                          <div className="flex items-center gap-2 flex-1 bg-muted/10 border border-muted/30 rounded-xl px-3 py-2">
                            <span className="font-mono text-sm truncate">
                              {cred.key}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(cred.key, cred.id)}
                              className="h-6 w-6 shrink-0"
                            >
                              {copiedId === cred.id ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>

                          {/* VALUE FIELD */}
                          <div className="flex items-center gap-2 flex-1 bg-muted/10 border border-muted/30 rounded-xl px-3 py-2">
                            <span className="font-mono text-sm truncate flex-1">
                              {visibleValues.has(cred.id)
                                ? cred.value
                                : "••••••••••••••"}
                            </span>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleValueVisibility(cred.id)}
                              className="h-6 w-6 shrink-0"
                            >
                              {visibleValues.has(cred.id) ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                copyToClipboard(cred.value, cred.id)
                              }
                              className="h-6 w-6 shrink-0"
                            >
                              {copiedId === cred.id ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* DESCRIPTION + DELETE */}
                        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                          <div className="space-y-1">
                            {cred.description && <p>{cred.description}</p>}
                            <p>Added {formatDate(cred.created_at)}</p>
                          </div>

                          {canManageProjects && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                requestDelete("credential", cred.id)
                              }
                              className="h-6 w-6 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" /> Enter Project Password
            </DialogTitle>
            <DialogDescription>
              Enter the password to view credentials for {selectedProject?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && verifyPassword()}
                placeholder="Enter password"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={verifyPassword}>
              <Unlock className="h-4 w-4 mr-2" /> Unlock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Project Dialog */}
      <Dialog
        open={showNewProjectDialog}
        onOpenChange={setShowNewProjectDialog}
      >
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to store environment credentials
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name *</Label>
              <Input
                id="project-name"
                value={newProject.name}
                onChange={(e) =>
                  setNewProject({ ...newProject, name: e.target.value })
                }
                placeholder="My Project"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
                placeholder="Project description..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-password">Project Password *</Label>
              <div className="flex gap-2">
                <Input
                  id="project-password"
                  type="text"
                  value={newProject.password}
                  onChange={(e) =>
                    setNewProject({ ...newProject, password: e.target.value })
                  }
                  placeholder="Enter secure password"
                />
                <Button
                  variant="ghost"
                  onClick={() =>
                    setNewProject((p) => ({
                      ...p,
                      password: generatePassword(24),
                    }))
                  }
                  aria-label="Generate password"
                >
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This password will be required to view credentials
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewProjectDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={createProject}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Credential Dialog */}
      <Dialog
        open={showNewCredentialDialog}
        onOpenChange={setShowNewCredentialDialog}
      >
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Add New Credential</DialogTitle>
            <DialogDescription>
              Add an environment variable or API key
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cred-key">Key *</Label>
              <Input
                id="cred-key"
                value={newCredential.key}
                onChange={(e) =>
                  setNewCredential({ ...newCredential, key: e.target.value })
                }
                placeholder="DATABASE_URL"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cred-value">Value *</Label>
              <Textarea
                id="cred-value"
                value={newCredential.value}
                onChange={(e) =>
                  setNewCredential({ ...newCredential, value: e.target.value })
                }
                placeholder="postgresql://..."
                rows={3}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cred-description">Description</Label>
              <Input
                id="cred-description"
                value={newCredential.description}
                onChange={(e) =>
                  setNewCredential({
                    ...newCredential,
                    description: e.target.value,
                  })
                }
                placeholder="Production database connection"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewCredentialDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={addCredential}>
              <Plus className="h-4 w-4 mr-2" /> Add Credential
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete dialog */}
      <Dialog
        open={!!showConfirmDelete}
        onOpenChange={() => setShowConfirmDelete(null)}
      >
        <DialogContent className="sm:max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Confirm delete</DialogTitle>
            <DialogDescription>
              Are you sure? This action cannot be undone (you'll have 5s to
              undo).
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {showConfirmDelete?.name && (
              <div className="font-medium">{showConfirmDelete.name}</div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDelete(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!showConfirmDelete) return;
                if (
                  showConfirmDelete.type === "project" &&
                  showConfirmDelete.id
                )
                  deleteProject(showConfirmDelete.id);
                if (
                  showConfirmDelete.type === "credential" &&
                  showConfirmDelete.id
                )
                  deleteCredential(showConfirmDelete.id);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
