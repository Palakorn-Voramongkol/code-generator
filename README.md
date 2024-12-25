```markdown
# 🛠️ Schema-to-NestJS Backend Generator

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-%3E%3D%2014.0.0-blue.svg)
![NestJS](https://img.shields.io/badge/NestJS-%5E9.0.0-informational)

## 📦 Introduction

**Schema-to-NestJS Backend Generator** is a powerful tool that transforms your database schema images or Prisma schema definitions into fully functional NestJS microservices equipped with JWT authentication. Streamline your backend development by automating the creation of essential components such as DTOs, controllers, and services for every entity in your database.

## 🚀 Features

- **Image-Based Schema Input**: Upload a picture of your database schema or provide a Prisma schema file, and let the generator handle the rest.
- **Comprehensive NestJS Microservices**: Automatically generates DTOs, controllers, and service components for each entity.
- **JWT Authentication**: Built-in JWT support for secure authentication and authorization.
- **Relationship Handling**: Supports one-to-one, one-to-many, and many-to-many relationships seamlessly.
- **Scalable Architecture**: Designed to generate scalable and maintainable NestJS backends.
- **Customizable Templates**: Easily customize the generated code to fit your specific needs.

## 🛠️ Technologies Used

- [NestJS](https://nestjs.com/) - A progressive Node.js framework for building efficient and scalable server-side applications.
- [TypeScript](https://www.typescriptlang.org/) - A strongly typed programming language that builds on JavaScript.
- [JWT (JSON Web Tokens)](https://jwt.io/) - For secure authentication and authorization.
- [Prisma](https://www.prisma.io/) - An ORM for database interactions.
- [OCR Libraries](https://github.com/) - To process and interpret database schema images.
- [OCR Libraries](https://github.com/) - To process and interpret database schema images.

## 📥 Installation

### Prerequisites

- **Node.js**: Ensure you have Node.js (v14 or higher) installed. [Download Node.js](https://nodejs.org/)
- **Nest CLI**: Install the NestJS CLI globally.

```bash
npm install -g @nestjs/cli
```

### Clone the Repository

```bash
git clone https://github.com/Palakorn-Voramongkol/code-generator.git
cd code-generator
```

### Install Dependencies

```bash
npm install
```


## 🖼️ Example

### Input Prisma Schema

```prisma
generator client {
    provider = "prisma-client-js"
}

datasource db {
    provider = "postgresql" // Change to your database provider (e.g., mysql, sqlite)
    url      = env("DATABASE_URL")
}

model Employee {
    id               Int               @id @default(autoincrement())
    name             String
    email            String            @unique
    department       Department?       @relation(fields: [departmentId], references: [id])
    departmentId     Int?
    profile          Profile?          @relation("EmployeeProfile")
    employeeProjects EmployeeProject[]
    createdAt        DateTime          @default(now())
    updatedAt        DateTime          @updatedAt
}

model Department {
    id        Int        @id @default(autoincrement())
    name      String
    employees Employee[]
    createdAt DateTime   @default(now())
    updatedAt DateTime   @updatedAt
}

model Profile {
    id         Int      @id @default(autoincrement())
    bio        String
    employee   Employee @relation("EmployeeProfile", fields: [employeeId], references: [id])
    employeeId Int      @unique
    createdAt  DateTime @default(now())
    updatedAt  DateTime @updatedAt
}

model Project {
    id               Int               @id @default(autoincrement())
    name             String
    employeeProjects EmployeeProject[]
    createdAt        DateTime          @default(now())
    updatedAt        DateTime          @updatedAt
}

model EmployeeProject {
    id         Int      @id @default(autoincrement())
    employee   Employee @relation(fields: [employeeId], references: [id])
    employeeId Int
    project    Project  @relation(fields: [projectId], references: [id])
    projectId  Int
    assignedAt DateTime @default(now())
    @@unique([employeeId, projectId], name: "employeeId_projectId")
}
```

### Generated Project Structure

```
generated-nestjs-backend/
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   └── jwt.strategy.ts
│   ├── common/
│   │   └── dto/
│   ├── entities/
│   │   ├── employee.entity.ts
│   │   ├── department.entity.ts
│   │   ├── profile.entity.ts
│   │   ├── project.entity.ts
│   │   └── employee-project.entity.ts
│   ├── controllers/
│   │   ├── employee.controller.ts
│   │   ├── department.controller.ts
│   │   ├── profile.controller.ts
│   │   ├── project.controller.ts
│   │   └── employee-project.controller.ts
│   ├── services/
│   │   ├── employee.service.ts
│   │   ├── department.service.ts
│   │   ├── profile.service.ts
│   │   ├── project.service.ts
│   │   └── employee-project.service.ts
│   ├── dto/
│   │   ├── create-employee.dto.ts
│   │   ├── update-employee.dto.ts
│   │   ├── create-department.dto.ts
│   │   ├── update-department.dto.ts
│   │   ├── create-profile.dto.ts
│   │   ├── update-profile.dto.ts
│   │   ├── create-project.dto.ts
│   │   ├── update-project.dto.ts
│   │   ├── create-employee-project.dto.ts
│   │   └── update-employee-project.dto.ts
│   └── main.ts
├── test/
├── .env
├── nest-cli.json
├── package.json
└── README.md
```

### Explanation

Given the Prisma schema above, the generator will create NestJS modules, controllers, services, entities, and DTOs for each model (`Employee`, `Department`, `Profile`, `Project`, and `EmployeeProject`). It also handles the relationships such as one-to-one (`Employee` and `Profile`), one-to-many (`Department` and `Employee`), and many-to-many (`Employee` and `Project` through `EmployeeProject`).

## 🔧 Configuration

After generation, you might want to adjust the following:

- **Environment Variables**: Configure your `.env` file for database connections and JWT secrets.

  ```env
  DATABASE_URL=postgresql://user:password@localhost:5432/mydb
  JWT_SECRET=your_jwt_secret
  ```

- **Database Setup**: Ensure your database is set up and accessible. Run Prisma migrations if necessary.

  ```bash
  npx prisma migrate dev --name init
  ```

- **Additional Middleware**: Add any middleware or plugins as required by your application.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the Repository**

2. **Create a Feature Branch**

   ```bash
   git checkout -b feature/YourFeature
   ```

3. **Commit Your Changes**

   ```bash
   git commit -m "Add some feature"
   ```

4. **Push to the Branch**

   ```bash
   git push origin feature/YourFeature
   ```

5. **Open a Pull Request**

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 📫 Contact

For any inquiries or support, please open an issue or contact [your.email@example.com](mailto:your.email@example.com).

## 📝 Acknowledgements

- Inspired by the need to accelerate backend development with NestJS.
- Utilizes powerful OCR and code generation libraries to bridge the gap between design and implementation.
```

