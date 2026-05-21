# Master-Finance SaaS 🏥💰

Master-Finance is a SaaS system developed to efficiently manage the flow of items (inventory and finances) within clinic units. The main goal is to track financial and inventory movements, recording input and output values, automatically calculating totals, and ensuring strict access governance via Role-Based Access Control (RBAC).

## 1. Core Entities

- **Unit:** Represents the physical clinics (headquarters, branches).
- **Sector:** Departments or divisions within a clinic (e.g., Reception, ICU, Inventory).
- **Item:** The resource or product being tracked.
- **Transaction (Movement):** A record of an item entering or leaving the clinic in a specific month. Includes date, type (Entry/Exit), value, quantity, and the associated item.
- **User:** The system collaborator, who has an access level (Role) and can be linked to a specific Unit.

## 2. Authentication and Accounts

- [ ] Authenticate using E-mail and Password.
- [ ] (Optional) Authenticate via social providers (e.g., Github, Google).
- [ ] Recover password via e-mail.
- [ ] Invite new users to the system.

## 3. Features

### Unit & Sector Management

- [ ] Create, view, update, and deactivate Units.
- [ ] Create, view, update, and delete Sectors within units.

### User Management

- [ ] Invite new members to the system, assigning them a Role.
- [ ] Edit permissions (Roles) and the Unit to which a user belongs.

### Financial & Item Management (Monthly Tracking)

- [ ] Register new items in the system.
- [ ] **Monthly Transaction Management:** An interface to select a specific month and register item movements.
  - Fields include: Date, Type (Entry/Exit), Value, Quantity, and the Item.
  - Ability to continuously add transactions into a table and save/update the month's records.
- [ ] Automatically calculate the total value / financial balance (Entry vs. Exit) per item and unit.
- [ ] **Reports & Analytics:** Generate visual reports using charts and other data visualization tools to analyze monthly and annual data.

## 4. Authorization and Business Rules (RBAC)

The system uses **CASL** for strict permission control based on the following Roles:

| Role         | Description                   | Permissions                                                                                                                                                          |
| :----------- | :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ADMIN**    | System Maintainer (Root)      | Has **unrestricted** access to all features, settings, and entities.                                                                                                 |
| **MANAGER**  | Clinic Network Manager (Boss) | Can create and manage **all** Units, Sectors, Items, Transactions, and Users. Can navigate across all units to supervise, analyze discrepancies, and resolve issues. |
| **EMPLOYEE** | Operational Staff             | Can create, read, edit, and delete Items and Transactions **only** for the Unit they are registered in. **Cannot** manage Units, create Sectors, or manage Users.    |
