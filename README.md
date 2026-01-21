docker-compose -f infra/docker-compose.yml up -d

 User
 └── TenantMember (role)
        └── Tenant
              └── Notes (owner)
                    └── NoteShares


# User LifeCycle Usecases
```
graph LR
    Anon((Anonymous User))
    AuthU((Authenticated User))

    subgraph "Authentication (Auth Level)"
        UC1("Sign Up with Email")
        UC2("Verify Email")
        UC3("Sign In / Login")
    end

    subgraph "Account (Profile Level)"
        UC4("Update Profile")
        UC5("Delete Account")
    end

    subgraph "System Entry"
        UC6("Create First Tenant")
    end

    Anon --> UC1
    UC1 --> UC2
    UC2 --> UC3
    UC3 --> AuthU
    
    AuthU --> UC4
    AuthU --> UC5
    AuthU --> UC6

    %% Guard Rules
    UC5 -.->|"[Check: Not Last Owner]"| UC5
```


# Tenant System Usecases
```
graph TD
    O((Owner))
    A((Admin))
    M((Member))

    %% Hierarchy
    O --- A
    A --- M

    subgraph "Resources"
        UC_NOTE(Manage Notes)
        UC_SHARE(Share Note)
    end

    subgraph "Personnel Management"
        UC_APP(Approve/Reject Request)
        UC_INV(Invite New User)
        UC_REM(Remove Member)
    end

    subgraph "System Administration"
        UC_ROLE(Change Roles)
        UC_UP(Update Tenant Info)
        UC_DEL(Delete Tenant)
    end

    %% Mapping
    M --> UC_NOTE
    M --> UC_SHARE
    
    A --> UC_APP
    A --> UC_INV
    A --> UC_REM

    O --> UC_ROLE
    O --> UC_UP
    O --> UC_DEL

    %% Guards
    UC_REM -.-> G_REM["[ERR: CANNOT_REMOVE_OWNER]"]
    UC_ROLE -.-> G_ROLE["[ERR: MIN_ONE_OWNER_REQUIRED]"]
    UC_DEL -.-> G_DEL["[ERR: MULTIPLE_OWNERS_EXIST]"]

    style UC_DEL fill:#f5222d,color:#fff
    style UC_UP fill:#fff7e6
```

# Stranger Journey Usecases
```
graph LR
    S((User/Stranger))

    subgraph "Inbound (Stranger initiates)"
        UC1(Request to Join)
        UC2(Cancel Join Request)
    end

    subgraph "Outbound (Admin invited User)"
        UC3(Accept Invite)
        UC4(Decline/Reject Invite)
    end

    S --> UC1
    S --> UC2
    S --> UC3
    S --> UC4

    %% Test Case Hooks
    UC1 -.->|"[Check: No active request]"| UC1
    UC3 -.->|"[Check: Status = invited]"| UC3
    UC4 -.->|"[Check: Status = invited]"| UC4

    style UC3 fill:#f6ffed,stroke:#52c41a
    style UC4 fill:#fff1f0,stroke:#f5222d
```