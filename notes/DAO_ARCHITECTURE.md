# DAO (Data Access Object) Architecture

## Overview
The DAO layer is now the single source of truth for all database operations. This follows proper separation of concerns:

- **Models** (`src/models/`) → Schema definitions only
- **DAO** (`src/dao/`) → All database operations
- **Services** (`src/services/`) → Business logic only
- **Controllers** (`src/controllers/`) → Request handling only

## DAO Layer Structure

### UserDAO (`src/dao/UserDAO.ts`)
Handles all User model database operations:
- `createUser()` - Create credential-based user
- `createGitHubUser()` - Create GitHub OAuth user
- `findByEmail()` - Find user by email
- `findByEmailWithPassword()` - Find user with password field
- `findByGitHubId()` - Find user by GitHub ID
- `findById()` - Find user by ID
- `findByIdWithRefreshToken()` - Find user with refresh token
- `updateUser()` - Update user fields
- `saveUser()` - Save user instance
- `updateRefreshTokenHash()` - Atomic refresh token update
- `clearRefreshTokenHash()` - Clear refresh token (logout)
- `clearRefreshTokenHashByUserId()` - Clear by user ID
- `userExistsByEmail()` - Check email existence

### RepositoryDAO (`src/dao/RepositoryDAO.ts`)
Handles all Repository model database operations:
- `createRepository()` - Create new repository record
- `findById()` - Find by repository ID
- `findByIdAndUserId()` - Find with ownership check
- `findByUserId()` - Find all user repositories
- `findByUserIdPaginated()` - Find with pagination
- `countByUserId()` - Count user repositories
- `findByStatus()` - Find by status
- `findByUserIdAndStatus()` - Find by user and status
- `updateRepository()` - Update repository
- `updateRepositoryStatus()` - Update status field
- `deleteById()` - Delete repository
- `deleteByIdAndUserId()` - Delete with ownership check
- `exists()` - Check existence
- `ownsRepository()` - Ownership verification

## Benefits

### 1. **Separation of Concerns**
- Database logic is isolated in DAOs
- Services focus on business logic
- Controllers handle HTTP concerns only

### 2. **Reusability**
- Services can easily reuse DAO methods
- New features can leverage existing DAOs
- No code duplication

### 3. **Testability**
- DAOs can be mocked for service unit tests
- Database operations are centralized
- Easier to write integration tests

### 4. **Maintainability**
- All database operations are in one place
- Changes to queries only need updates in DAO
- Clear contracts between layers

### 5. **Security**
- Ownership checks centralized in DAO (`ownsRepository`, `findByIdAndUserId`)
- Prevents bypassing authorization
- Easier to audit data access

### 6. **Performance**
- Easy to add caching in DAO layer
- Query optimization centralized
- Can add pagination/filtering at DAO level

## Usage Example

### Before (Direct Model Access)
```typescript
// ❌ Service directly accessing model
import { User } from "../../models/User.model";

export class AuthService {
  async login(email: string) {
    const user = await User.findOne({ email }).select("+password");
    // ...
  }
}
```

### After (Using DAO)
```typescript
// ✅ Service using DAO
import { UserDAO } from "../../dao/UserDAO";

export class AuthService {
  async login(email: string) {
    const user = await UserDAO.findByEmailWithPassword(email);
    // ...
  }
}
```

## Adding New Database Operations

When you need a new database operation:

1. **Add method to appropriate DAO** (`UserDAO` or `RepositoryDAO`)
2. **Use static methods** for consistency
3. **Include validation** (ObjectId checks, null safety)
4. **Document the method** with JSDoc
5. **Use in service** instead of direct model access

### Example: Add new user search
```typescript
// In UserDAO
static async findByUsername(username: string): Promise<UserDocument | null> {
  return User.findOne({ username });
}

// In service
const user = await UserDAO.findByUsername(username);
```

## Best Practices

1. ✅ Always use DAO methods from services
2. ✅ Keep models in `src/models/` (schema only)
3. ✅ All database queries go to `src/dao/`
4. ✅ Validate IDs before database operations
5. ✅ Use descriptive DAO method names
6. ✅ Document complex queries with comments
7. ✅ Handle ownership checks in DAO methods

## Never Do

1. ❌ Import models directly in services
2. ❌ Use `Model.find()` directly in controllers
3. ❌ Bypass DAO for database operations
4. ❌ Mix database logic with business logic
5. ❌ Forget to validate ObjectIds

## File Organization

```
backend/src/
├── dao/
│   ├── UserDAO.ts          ← All user queries
│   ├── RepositoryDAO.ts    ← All repository queries
│   └── index.ts            ← Exports
├── models/
│   ├── User.model.ts       ← Schema only
│   └── Repository.model.ts ← Schema only
├── services/
│   ├── auth/
│   │   └── auth.service.ts ← Uses UserDAO
│   └── repo/
│       └── repo.service.ts ← Uses RepositoryDAO
└── controllers/
    ├── auth/
    │   └── auth.controller.ts ← Uses services
    └── repo/
        └── repo.controller.ts ← Uses services
```

## Migration Complete ✅
All direct model access has been replaced with DAO calls.
The codebase now follows proper layered architecture!
