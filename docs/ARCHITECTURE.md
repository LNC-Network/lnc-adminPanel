# System Architecture

> **Technical architecture documentation with visual diagrams for the LNC Admin Panel.**

## Table of Contents

- [Permission System Architecture](#permission-system-architecture)
- [Database Schema](#database-schema)
- [Email Notification System](#email-notification-system)
- [User Registration Flow](#user-registration-flow)
- [PWA Architecture](#pwa-architecture)
- [Chat Notification System](#chat-notification-system)

---

## Permission System Architecture

### Role Hierarchy

![Permission Hierarchy](./images/lnc_permission_hierarchy_1770225557777.png)

### Permission Check Flow

```mermaid
flowchart TD
    A[User Request] --> B[Extract ID]
    B --> C[Check Roles & Permissions]
    C --> D{Allowed?}
    D -->|Yes| E[Execute]
    D -->|No| F[403 Forbidden]
    
    style A fill:#fff,stroke:#000,stroke-width:2px,color:#000
    style F fill:#000,stroke:#fff,stroke-width:2px,color:#fff
```

### Access Control Summary

| Role | User Mgmt | Content | Settings | Database |
|------|-----------|---------|----------|----------|
| **Super Admin** | Full | Full | Full | Full |
| **Adminstater** | Read | Read | Read | No |
| **Team Admin** | Team | Team | Team | No |
| **Team Member** | No | Create/Read | No | No |

### Implementation Layers

### Implementation Layers

![Permission Implementation Layers](./images/lnc_permission_layers_1770226168049.png)

---

## Database Schema

### Entity Relationships

![Database Schema](./images/lnc_database_schema_1770225496119.png)

The database consists of five core entities:
- **Users**: Central identity with authentication details.
- **Roles & Permissions**: Manage access control (concise pivot tables).
- **EmailQueue**: Tracks notifications.
- **Tickets**: Manages support requests.


### Core Tables Structure

```mermaid
graph LR
    subgraph Auth["Authentication"]
        U[users]
        UR[user_roles]
        R[roles]
        P[permissions]
        RP[role_permissions]
    end
    
    subgraph Content["Content Management"]
        PU[pending_users]
        T[tickets]
    end
    
    subgraph Notifications["Email System"]
        ET[email_templates]
        EQ[email_queue]
        EL[email_logs]
    end
    
    U --> UR
    UR --> R
    R --> RP
    RP --> P
    
    U --> PU
    U --> T
    
    ET --> EQ
    EQ --> EL
    U --> EQ
    
    style Auth fill:#fff,stroke:#000,stroke-width:2px,color:#000
    style Content fill:#fff,stroke:#000,stroke-width:2px,color:#000
    style Notifications fill:#fff,stroke:#000,stroke-width:2px,color:#000
```

---

## Email Notification System

### Email Queue Processing Flow

![Email System Architecture](./images/lnc_email_architecture_1770225650167.png)

### Available Email Templates

```mermaid
graph TB
    ET[Email Templates] --> W[welcome<br/>New user creation]
    ET --> RA[registration_approved<br/>Approval notification]
    ET --> RR[registration_rejected<br/>Rejection notice]
    ET --> PR[password_reset<br/>Reset link]
    ET --> TA[ticket_assigned<br/>Assignment alert]
    ET --> RC[role_changed<br/>Role update notice]
    
    style ET fill:#000,stroke:#fff,stroke-width:2px,color:#fff
    style W fill:#fff,stroke:#000,stroke-width:2px,color:#000
    style RA fill:#fff,stroke:#000,stroke-width:2px,color:#000
    style RR fill:#fff,stroke:#000,stroke-width:2px,color:#000
    style PR fill:#fff,stroke:#000,stroke-width:2px,color:#000
    style TA fill:#fff,stroke:#000,stroke-width:2px,color:#000
    style RC fill:#fff,stroke:#000,stroke-width:2px,color:#000
```

---

## User Registration Flow

### Complete Registration Workflow

```mermaid
sequenceDiagram
    participant U as New User
    participant L as Login Page
    participant A as API /auth/register
    participant DB as Database
    participant Admin as Admin Panel
    participant EA as Email API
    
    U->>L: Click "Register for Account"
    L->>U: Show registration form
    U->>L: Fill form & submit
    L->>A: POST registration data
    
    A->>DB: Check email exists
    DB-->>A: Not found
    A->>DB: Check pending_users
    DB-->>A: Not found
    
    A->>A: Hash password with argon2
    A->>DB: INSERT into pending_users<br/>status: pending
    DB-->>A: Success
    A-->>L: Registration submitted
    L-->>U: Show success message
    
    Admin->>DB: Query pending_users<br/>WHERE status = 'pending'
    DB-->>Admin: Show pending list
    Admin->>Admin: Review request
    
    alt Approval
        Admin->>A: PATCH approve + assign role
        A->>DB: INSERT into users
        A->>DB: INSERT into user_roles
        A->>DB: UPDATE pending_users<br/>status: approved
        A->>EA: Send approval email
        EA-->>U: Email: Account approved
        A-->>Admin: User created
    else Rejection
        Admin->>A: PATCH reject + reason
        A->>DB: UPDATE pending_users<br/>status: rejected
        A->>EA: Send rejection email
        EA-->>U: Email: Request rejected
        A-->>Admin: Request rejected
    end
    
    rect rgb(240,240,240)
        Note over U,EA: User can now login with approved credentials
    end
```

### Registration State Machine

```mermaid
stateDiagram-v2
    [*] --> Pending: User submits registration
    Pending --> Approved: Admin approves
    Pending --> Rejected: Admin rejects
    
    Approved --> [*]: User account created
    Rejected --> [*]: Request archived
    
    note right of Pending
        Email: @lnc.com
        Password: Hashed
        Team: Selected
    end note
    
    note right of Approved
        Creates user in users table
        Assigns role
        Sends approval email
    end note
    
    note right of Rejected
        Stores rejection reason
        Sends rejection email
    end note
```

---

## PWA Architecture

### Service Worker Caching Strategy

![PWA Architecture](./images/lnc_pwa_architecture_1770225688890.png)

### PWA Component Structure

```mermaid
graph TB
    subgraph Browser["Browser"]
        P[Page]
    end
    
    subgraph SW["Service Worker"]
        C[Cache Storage]
        F[Fetch Handler]
        I[Install Handler]
        A[Activate Handler]
    end
    
    subgraph Server["Next.js Server"]
        R[Routes]
        API[API Endpoints]
        S[Static Assets]
    end
    
    P <--> F
    F <--> C
    F <--> R
    F <--> API
    F <--> S
    
    I --> C
    A --> C
    
    style Browser fill:#fff,stroke:#000,stroke-width:2px,color:#000
    style SW fill:#fff,stroke:#000,stroke-width:2px,color:#000
    style Server fill:#fff,stroke:#000,stroke-width:2px,color:#000
```

### Install Flow

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant SW as Service Worker
    participant M as Manifest
    
    U->>B: Visit site (HTTPS)
    B->>SW: Register service worker
    SW->>SW: Install event
    SW->>SW: Cache core assets
    B->>M: Parse manifest.json
    B->>B: Check installability
    B->>U: Show install prompt
    U->>B: Click "Install"
    B->>B: Add to home screen
    B->>U: Launch as standalone app
    
    rect rgb(240,240,240)
        Note over U,M: App now works offline<br/>and has app icon
    end rect
```

---

## Chat Notification System

### Unseen Message Tracking

## Chat Notification System

![Chat System Architecture](./images/lnc_chat_architecture_1770226110404.png)

### Unseen Message Tracking

The system tracks every message sent to a conversation and increments the unseen count for recipients. When a user views the conversation, the count is cleared.

### Real-time Updates

Supabase Realtime listens for changes to the `messages` table and instantly updates the UI for active users.

---

## File Organization

### Project Structure

```
lnc-adminPanel/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts          ← JWT generation
│   │   │   └── register/route.ts       ← User registration
│   │   ├── users/
│   │   │   ├── create/route.ts         ← User creation (Super Admin)
│   │   │   ├── pending/route.ts        ← Approval/rejection
│   │   │   └── update-roles/route.ts   ← Role management
│   │   ├── email/
│   │   │   ├── send/route.ts           ← Send emails
│   │   │   ├── queue/route.ts          ← View queue
│   │   │   └── process/route.ts        ← Cron processor
│   │   └── chat/
│   │       ├── messages/route.ts       ← Message CRUD
│   │       └── mark-read/route.ts      ← Clear unseen
│   └── dashboard/
│       └── page.tsx                    ← Main dashboard
├── components/
│   ├── dashboard/                      ← Dashboard components
│   ├── ui/                             ← shadcn/ui components
│   └── pwa-register.tsx               ← PWA functionality
├── lib/
│   ├── permissions.ts                  ← Client-side helpers
│   ├── permission-check.ts             ← Server-side checks
│   ├── email-service.ts                ← Email functions
│   └── supabase.ts                     ← Database client
├── public/
│   ├── manifest.json                   ← PWA manifest
│   ├── service-worker.js               ← Offline caching
│   └── icons/                          ← PWA icons
└── docs/                               ← Documentation
    ├── README.md
    ├── ARCHITECTURE.md                 ← This file
    ├── SETUP-GUIDE.md
    ├── USER-GUIDE.md
    └── DEVELOPER-GUIDE.md
```

---

## Technology Dependencies

## Technology Dependencies

![Technology Stack](./images/lnc_tech_stack_1770226130725.png)

---

**Navigation**: [← Back to Index](README.md) | [Next: Setup Guide →](SETUP-GUIDE.md)

