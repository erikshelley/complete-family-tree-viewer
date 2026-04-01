# Mermaid Diagram Samples

Diagram types confirmed stable on both GitHub and VS Code.

---

## Flowchart

```mermaid
flowchart TD
    A([Start]) --> B{Condition?}
    B -- yes --> C[Do something]
    B -- no --> D[Do other thing]
    C --> E([End])
    D --> E
```

---

## Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant App
    participant API

    User->>App: Click button
    App->>API: GET /data
    API-->>App: 200 OK
    App-->>User: Show result
```

---

## Class Diagram

```mermaid
classDiagram
    class Animal {
        +String name
        +makeSound() void
    }
    class Dog {
        +fetch() void
    }
    Animal <|-- Dog
```

---

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Loading : fetch()
    Loading --> Ready : success
    Loading --> Error : failure
    Error --> Idle : retry
    Ready --> [*]
```

---

## Entity Relationship Diagram

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    PRODUCT ||--o{ LINE_ITEM : "included in"
```

---

## User Journey

```mermaid
journey
    title User opens the app
    section Launch
        Open app: 5: User
        Wait for load: 3: User
    section Browse
        View list: 4: User
        Select item: 5: User
```

---

## Gantt

```mermaid
gantt
    title Project Plan
    dateFormat YYYY-MM-DD
    section Phase 1
        Design      :done,  a1, 2025-01-01, 7d
        Development :active, a2, after a1, 14d
    section Phase 2
        Testing     : a3, after a2, 7d
        Release     : a4, after a3, 2d
```

---

## Pie Chart

```mermaid
pie title Browser Usage
    "Chrome" : 65
    "Firefox" : 15
    "Safari" : 12
    "Other" : 8
```

---

## Requirement Diagram

```mermaid
requirementDiagram
    requirement login_req {
        id: 1
        text: User must be able to log in
        risk: high
        verifyMethod: test
    }
    element login_form {
        type: component
    }
    login_form - satisfies -> login_req
```

---

## Git Graph

```mermaid
gitGraph
    commit
    commit
    branch feature
    commit
    commit
    checkout main
    merge feature
    commit
```

---

## Mindmap

```mermaid
mindmap
    root((Project))
        Frontend
            UI components
            Styling
        Backend
            API
            Database
        Testing
            Unit
            Integration
```

---

## Timeline

```mermaid
timeline
    title Product History
    2022 : Initial release
    2023 : Added export feature
         : Performance improvements
    2024 : Mobile support
    2025 : Dark mode
```

---

## Quadrant Chart

```mermaid
quadrantChart
    title Priority vs Effort
    x-axis Low Effort --> High Effort
    y-axis Low Priority --> High Priority
    quadrant-1 Do later
    quadrant-2 Schedule
    quadrant-3 Delegate
    quadrant-4 Do first
    Feature A: [0.2, 0.8]
    Feature B: [0.7, 0.9]
    Feature C: [0.4, 0.3]
    Feature D: [0.8, 0.2]
```
