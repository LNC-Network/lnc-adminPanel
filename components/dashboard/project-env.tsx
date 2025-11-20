"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
    AlertCircle
} from "lucide-react";

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

export default function ProjectEnv({ userRole }: ProjectEnvProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
    const [showNewCredentialDialog, setShowNewCredentialDialog] = useState(false);
    const [password, setPassword] = useState("");
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [visibleValues, setVisibleValues] = useState<Set<number>>(new Set());

    // New project form
    const [newProject, setNewProject] = useState({
        name: "",
        description: "",
        password: ""
    });

    // New credential form
    const [newCredential, setNewCredential] = useState({
        key: "",
        value: "",
        description: ""
    });

    const canManageProjects = ["dev_admin", "super admin"].includes(userRole);
    const canViewProjects = ["dev_member", "dev_admin", "super admin"].includes(userRole);

    useEffect(() => {
        if (canViewProjects) {
            fetchProjects();
        }
    }, [canViewProjects]);

    const fetchProjects = async () => {
        try {
            const res = await fetch("/api/projects");
            const data = await res.json();

            if (res.ok) {
                setProjects(data.projects);
            } else {
                toast.error(data.error || "Failed to fetch projects");
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
            toast.error("Failed to load projects");
        }
    };

    const handleProjectClick = (project: Project) => {
        setSelectedProject(project);
        setShowPasswordDialog(true);
        setPassword("");
        setIsUnlocked(false);
    };

    const verifyPassword = async () => {
        if (!selectedProject || !password) {
            toast.error("Please enter password");
            return;
        }

        try {
            const res = await fetch("/api/projects/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: selectedProject.id,
                    password
                })
            });

            const data = await res.json();

            if (res.ok && data.valid) {
                setIsUnlocked(true);
                setShowPasswordDialog(false);
                fetchCredentials(selectedProject.id);
                toast.success("Project unlocked successfully");
            } else {
                toast.error("Incorrect password");
            }
        } catch (error) {
            console.error("Error verifying password:", error);
            toast.error("Failed to verify password");
        }
    };

    const fetchCredentials = async (projectId: number) => {
        try {
            const res = await fetch(`/api/projects/credentials?projectId=${projectId}`);
            const data = await res.json();

            if (res.ok) {
                setCredentials(data.credentials);
            } else {
                toast.error(data.error || "Failed to fetch credentials");
            }
        } catch (error) {
            console.error("Error fetching credentials:", error);
            toast.error("Failed to load credentials");
        }
    };

    const createProject = async () => {
        if (!newProject.name || !newProject.password) {
            toast.error("Name and password are required");
            return;
        }

        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newProject)
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Project created successfully");
                setShowNewProjectDialog(false);
                setNewProject({ name: "", description: "", password: "" });
                fetchProjects();
            } else {
                toast.error(data.error || "Failed to create project");
            }
        } catch (error) {
            console.error("Error creating project:", error);
            toast.error("Failed to create project");
        }
    };

    const deleteProject = async (projectId: number) => {
        if (!confirm("Are you sure? This will delete all credentials in this project.")) {
            return;
        }

        try {
            const res = await fetch(`/api/projects?id=${projectId}`, {
                method: "DELETE"
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Project deleted successfully");
                fetchProjects();
                if (selectedProject?.id === projectId) {
                    setSelectedProject(null);
                    setIsUnlocked(false);
                    setCredentials([]);
                }
            } else {
                toast.error(data.error || "Failed to delete project");
            }
        } catch (error) {
            console.error("Error deleting project:", error);
            toast.error("Failed to delete project");
        }
    };

    const addCredential = async () => {
        if (!selectedProject || !newCredential.key || !newCredential.value) {
            toast.error("Key and value are required");
            return;
        }

        try {
            const res = await fetch("/api/projects/credentials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: selectedProject.id,
                    ...newCredential
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Credential added successfully");
                setShowNewCredentialDialog(false);
                setNewCredential({ key: "", value: "", description: "" });
                fetchCredentials(selectedProject.id);
            } else {
                toast.error(data.error || "Failed to add credential");
            }
        } catch (error) {
            console.error("Error adding credential:", error);
            toast.error("Failed to add credential");
        }
    };

    const deleteCredential = async (credentialId: number) => {
        if (!confirm("Are you sure you want to delete this credential?")) {
            return;
        }

        try {
            const res = await fetch(`/api/projects/credentials?id=${credentialId}`, {
                method: "DELETE"
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Credential deleted successfully");
                if (selectedProject) {
                    fetchCredentials(selectedProject.id);
                }
            } else {
                toast.error(data.error || "Failed to delete credential");
            }
        } catch (error) {
            console.error("Error deleting credential:", error);
            toast.error("Failed to delete credential");
        }
    };

    const toggleValueVisibility = (id: number) => {
        const newVisible = new Set(visibleValues);
        if (newVisible.has(id)) {
            newVisible.delete(id);
        } else {
            newVisible.add(id);
        }
        setVisibleValues(newVisible);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    if (!canViewProjects) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-4">
                    <Shield className="h-16 w-16 mx-auto text-muted-foreground" />
                    <h2 className="text-2xl font-bold">Access Denied</h2>
                    <p className="text-muted-foreground">This feature is only available to dev team members.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <FolderLock className="h-6 w-6 sm:h-8 sm:w-8" />
                        Project ENV
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Secure environment credentials management
                    </p>
                </div>
                {canManageProjects && (
                    <Button onClick={() => setShowNewProjectDialog(true)} className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        New Project
                    </Button>
                )}
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                    <Card
                        key={project.id}
                        className={`cursor-pointer transition-all hover:shadow-lg ${selectedProject?.id === project.id && isUnlocked ? "border-primary ring-2 ring-primary/20" : ""
                            }`}
                        onClick={() => handleProjectClick(project)}
                    >
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        {selectedProject?.id === project.id && isUnlocked ? (
                                            <Unlock className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <Lock className="h-5 w-5" />
                                        )}
                                        {project.name}
                                    </CardTitle>
                                    <CardDescription className="mt-2">
                                        {project.description || "No description"}
                                    </CardDescription>
                                </div>
                                {canManageProjects && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteProject(project.id);
                                        }}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-muted-foreground">
                                Created {new Date(project.created_at).toLocaleDateString()}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Credentials Section */}
            {selectedProject && isUnlocked && (
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="h-5 w-5" />
                                    {selectedProject.name} Credentials
                                </CardTitle>
                                <CardDescription>
                                    Environment variables and API keys
                                </CardDescription>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                    onClick={() => setShowNewCredentialDialog(true)}
                                    className="flex-1 sm:flex-none"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Credential
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
                                    <Lock className="h-4 w-4 mr-2" />
                                    Lock
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {credentials.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No credentials added yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {credentials.map((cred) => (
                                    <div
                                        key={cred.id}
                                        className="border rounded-lg p-4 space-y-3 bg-muted/30"
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {cred.key}
                                                    </Badge>
                                                </div>
                                                {cred.description && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {cred.description}
                                                    </p>
                                                )}
                                            </div>
                                            {canManageProjects && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => deleteCredential(cred.id)}
                                                    className="text-destructive hover:text-destructive flex-shrink-0"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <div className="flex-1 font-mono text-sm bg-background border rounded px-3 py-2 overflow-x-auto">
                                                {visibleValues.has(cred.id) ? cred.value : "••••••••••••••••"}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => toggleValueVisibility(cred.id)}
                                            >
                                                {visibleValues.has(cred.id) ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyToClipboard(cred.value)}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="text-xs text-muted-foreground">
                                            Added {new Date(cred.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Password Dialog */}
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogContent className="sm:max-w-md mx-4">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Enter Project Password
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
                        <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={verifyPassword}>
                            <Unlock className="h-4 w-4 mr-2" />
                            Unlock
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Project Dialog */}
            <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
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
                                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                placeholder="My Project"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="project-description">Description</Label>
                            <Textarea
                                id="project-description"
                                value={newProject.description}
                                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                placeholder="Project description..."
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="project-password">Project Password *</Label>
                            <Input
                                id="project-password"
                                type="password"
                                value={newProject.password}
                                onChange={(e) => setNewProject({ ...newProject, password: e.target.value })}
                                placeholder="Enter secure password"
                            />
                            <p className="text-xs text-muted-foreground">
                                This password will be required to view credentials
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={createProject}>
                            Create Project
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Credential Dialog */}
            <Dialog open={showNewCredentialDialog} onOpenChange={setShowNewCredentialDialog}>
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
                                onChange={(e) => setNewCredential({ ...newCredential, key: e.target.value })}
                                placeholder="DATABASE_URL"
                                className="font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cred-value">Value *</Label>
                            <Textarea
                                id="cred-value"
                                value={newCredential.value}
                                onChange={(e) => setNewCredential({ ...newCredential, value: e.target.value })}
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
                                onChange={(e) => setNewCredential({ ...newCredential, description: e.target.value })}
                                placeholder="Production database connection"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNewCredentialDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={addCredential}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Credential
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
