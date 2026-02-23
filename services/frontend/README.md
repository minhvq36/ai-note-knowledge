# 1. Initialization & Context Flow
Đoạn mã
sequenceDiagram
    participant B as Browser_Main
    participant S as Core_State
    participant A as API_Me_Service
    participant T as API_Tenant_Service

    Note over B, T: Application Bootstrapping
    B->>S: Initialize Global State
    S->>A: GET /me/invites/pending (Check notifications)
    S->>T: GET /tenants (Fetch authorized tenants)
    T-->>S: Return Array of Tenants
    
    alt User has Tenants
        S->>S: Set currentTenantId = data[0].id
        S->>B: Trigger Dashboard Rendering
    else No Tenants Found
        S->>B: Trigger Onboarding UI
    end
    
# 2. Note Management Flow (Optimistic UI)

graph TD
    subgraph View ["Page: Notes.ts"]
        A[Action: Save Note] --> B[Extract Form Data]
    end

    subgraph ViewModel ["Core: State.ts"]
        B --> C{UI Logic Handler}
        C -->|Optimistic Update| D[Append Temp Note to UI List]
    end

    subgraph Model ["API: Note.service"]
        C --> E[POST /tenants/:id/notes]
    end

    subgraph Backend ["FastAPI + Supabase"]
        E --> F[FastAPI Router]
        F --> G[Supabase RPC: create_note]
    end

    G -->|Success| H[Return ApiResponse]
    H --> I{State Reconciler}
    I -->|Successful| J[Replace Temp Note with Persistent Note]
    I -->|Failed| K[Rollback Temp Note & Show Error Toast]

# 3. Modular Dependency Architecture

classDiagram
    class ApiClient {
        +string baseUrl
        +request(method, url, body)
        -handleUnauthorized()
    }

    class TenantService {
        +listTenants()
        +createTenant(name)
        +getMembers(tenantId)
    }

    class RequestService {
        +approveRequest(id)
        +inviteUser(tenantId, userId)
    }

    class StateStore {
        +Object currentTenant
        +Object currentUser
        +Array notes
        +notifySubscribers()
    }

    class UIComponent {
        +render(container)
        +attachEvents()
    }

    ApiClient <.. TenantService : Uses
    ApiClient <.. RequestService : Uses
    TenantService ..> StateStore : Updates Data
    StateStore <.. UIComponent : Subscribes to
    UIComponent ..> TenantService : Triggers Actions