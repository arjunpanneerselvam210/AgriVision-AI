# AgriVision AI — Backend API

Production-ready backend for **AgriVision AI** built with **Java 21, Spring Boot 3, Spring Security, Spring Data JPA, PostGIS, JWT, and Maven**.

---

## 1. Technology Stack

- **Language:** Java 21 LTS
- **Framework:** Spring Boot 3.3.4
- **Security:** Spring Security 6 with stateless JWT Bearer authentication
- **Persistence:** Spring Data JPA + Hibernate Spatial (PostGIS)
- **Database:** PostgreSQL with PostGIS extension (or H2 for local testing)
- **Validation:** Jakarta Bean Validation (Hibernate Validator)
- **Documentation:** SpringDoc OpenAPI 3 / Swagger UI (`/swagger-ui.html`)
- **Build Tool:** Apache Maven 3.9+

---

## 2. Package Architecture

```
com.agrivision/
├── AgriVisionApplication.java       # Spring Boot main class with @EnableJpaAuditing
├── config/
│   ├── SecurityConfig.java          # Stateless JWT filter chain, CORS & endpoint security
│   ├── OpenApiConfig.java           # Swagger / OpenAPI 3 with JWT Bearer scheme
│   └── DataInitializer.java        # Bootstrap default admin/analyst and study region
├── controller/
│   ├── AuthController.java          # POST /api/auth/{register, login, refresh}, GET /api/auth/me
│   ├── UserController.java          # GET /api/users/me, PUT /api/users/me
│   ├── StudyAreaController.java     # CRUD /api/study-areas
│   ├── FieldParcelController.java   # GET /api/fields, /api/fields/{id}, /api/fields/study-area/{id}
│   ├── CropClassificationController.java # GET /api/classifications, study area acreage summary
│   ├── SatelliteAnalysisController.java  # GET /api/satellite/analyses, /api/satellite/analyses/{id}
│   ├── ModelController.java         # GET /api/models, /api/models/{id}, /api/models/{id}/metrics
│   └── ReportController.java        # GET /api/reports/study-area/{studyAreaId}
├── dto/                             # Strongly typed Request / Response DTOs
├── entity/
│   ├── BaseAuditEntity.java         # Auditing timestamps (createdAt, updatedAt)
│   ├── Role.java                    # ADMIN, ANALYST, VIEWER
│   ├── CropType.java                # OTHER (0), PADDY (1), BANANA (2)
│   ├── User.java                    # User accounts with UUID primary key
│   ├── StudyArea.java               # Target geographic areas with PostGIS Geometry
│   ├── FieldParcel.java             # OBIA delineated field segments with spectral metrics
│   ├── CropClassification.java      # Classified crop determination records
│   ├── SatelliteAnalysis.java       # Sentinel-1 and Sentinel-2 scene acquisition logs
│   └── MlModel.java                 # Random Forest classifier metrics and ablation tests
├── exception/
│   ├── ResourceNotFoundException.java (404)
│   ├── BadRequestException.java (400)
│   ├── UnauthorizedException.java (401)
│   ├── ConflictException.java (409)
│   └── GlobalExceptionHandler.java  # Centralized exception handling with ErrorResponse DTO
├── mapper/
│   └── EntityDtoMapper.java         # Entity-to-DTO conversion & WKT geometry parser
├── repository/                      # Spring Data JPA repositories with aggregate queries
├── security/
│   ├── JwtTokenProvider.java        # Token signing, HMAC-SHA256, expiration, refresh tokens
│   ├── JwtAuthenticationFilter.java # OncePerRequestFilter extracting Bearer tokens
│   ├── CustomUserDetailsService.java# Database-backed user loader
│   ├── UserPrincipal.java           # UserDetails implementation
│   ├── JwtAuthenticationEntryPoint.java (401 JSON handler)
│   └── CustomAccessDeniedHandler.java   (403 JSON handler)
├── service/                         # Business logic services for all 8 modules
└── specification/
    └── FieldParcelSpecification.java# Dynamic multi-criteria filtering for field parcels
```

---

## 3. Quick Start & Execution

### Prerequisites
- JDK 21
- Maven 3.9+
- PostgreSQL with PostGIS extension (or local Docker container)

### Step 1: Configure Environment Variables
Copy `.env.example` to `.env` or set environment variables:
```bash
cp .env.example .env
```

### Step 2: Compile and Build
```bash
mvn clean compile
```

### Step 3: Run the Application
```bash
mvn spring-boot:run
```
The server will start on port `8080` (or `PORT` specified in environment).

### Step 4: Access Swagger Documentation
Open your browser to:
```
http://localhost:8080/swagger-ui.html
```
Interactive OpenAPI specification available at:
```
http://localhost:8080/v3/api-docs
```

---

## 4. Default Seeded Credentials

When launched for the first time, `DataInitializer` bootstraps:

| Email | Password | Role | Description |
|---|---|---|---|
| `admin@agrivision.ai` | `Admin@123456` | `ADMIN` | Full access to create/update/delete study areas and configurations |
| `analyst@agrivision.ai` | `Analyst@123456` | `ANALYST` | Access to manage study areas and run models |

*Note: In production environments, override default secrets and passwords via environment variables.*

---

## 5. Complete REST API Endpoints Catalog

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Description | Role / Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | Public |
| `POST` | `/api/auth/login` | Authenticate with email/password; returns JWT | Public |
| `POST` | `/api/auth/refresh` | Obtain new access token via refresh token | Public |
| `GET` | `/api/auth/me` | Get profile of active authenticated user | Authenticated |

### 2. User Management (`/api/users`)
| Method | Endpoint | Description | Role / Auth |
|---|---|---|---|
| `GET` | `/api/users/me` | Retrieve authenticated user profile | Authenticated |
| `PUT` | `/api/users/me` | Update full name and institution | Authenticated |

### 3. Study Areas (`/api/study-areas`)
| Method | Endpoint | Description | Role / Auth |
|---|---|---|---|
| `POST` | `/api/study-areas` | Create agricultural study region | `ADMIN`, `ANALYST` |
| `GET` | `/api/study-areas` | List study areas (paginated) | Authenticated |
| `GET` | `/api/study-areas/{id}` | Get study area by ID | Authenticated |
| `PUT` | `/api/study-areas/{id}` | Update study area | `ADMIN`, `ANALYST` |
| `DELETE` | `/api/study-areas/{id}` | Remove study area | `ADMIN` |

### 4. Field Parcels (`/api/fields`)
| Method | Endpoint | Description | Role / Auth |
|---|---|---|---|
| `GET` | `/api/fields` | Filter and paginate field segments (minArea, maxArea, cropClass, minNdvi, search) | Authenticated |
| `GET` | `/api/fields/{id}` | Retrieve specific parcel by ID | Authenticated |
| `GET` | `/api/fields/study-area/{studyAreaId}` | List parcels for a study region | Authenticated |

### 5. Crop Classification (`/api/classifications`)
| Method | Endpoint | Description | Role / Auth |
|---|---|---|---|
| `GET` | `/api/classifications` | Paginated classification records | Authenticated |
| `GET` | `/api/classifications/{id}` | Retrieve classification by ID | Authenticated |
| `GET` | `/api/classifications/study-area/{studyAreaId}` | List classifications in study area | Authenticated |
| `GET` | `/api/classifications/study-area/{studyAreaId}/summary` | Calculate dynamic Paddy, Banana, and Other acreage statistics | Authenticated |

### 6. Satellite Analysis (`/api/satellite/analyses`)
| Method | Endpoint | Description | Role / Auth |
|---|---|---|---|
| `GET` | `/api/satellite/analyses` | List Sentinel-1 and Sentinel-2 acquisitions | Authenticated |
| `GET` | `/api/satellite/analyses/{id}` | Get acquisition details and processing log | Authenticated |

### 7. Model Management (`/api/models`)
| Method | Endpoint | Description | Role / Auth |
|---|---|---|---|
| `GET` | `/api/models` | List registered ML models | Authenticated |
| `GET` | `/api/models/{id}` | Retrieve model metadata | Authenticated |
| `GET` | `/api/models/{id}/metrics` | Retrieve validation metrics, confusion matrix, feature importance, and ablation test | Authenticated |

### 8. Reports (`/api/reports`)
| Method | Endpoint | Description | Role / Auth |
|---|---|---|---|
| `GET` | `/api/reports/study-area/{studyAreaId}` | Generate complete agricultural report (taluk acreage, parcel counts, latest satellite scene, best model accuracy) | Authenticated |

---

## 6. Strict Scientific Integrity & No-Hardcoding Rules

1. **No Fake Satellite Results:**
   - When no satellite scenes or ML runs exist in the database, the API returns clean, standardized empty arrays or `0.0` totals (`totalFieldsDetected: 0`, `paddyAreaHa: 0.0`), without fabricating synthetic numbers.
2. **Dynamic Acreage Calculation:**
   - The `/api/classifications/study-area/{studyAreaId}/summary` endpoint computes acreage through real JPA database aggregation queries (`sumAreaHaByStudyAreaIdAndCropClass`).
3. **Pluggable Architecture:**
   - DTOs and API contracts are completely decoupled from internal data ingestion, allowing real Google Earth Engine processing jobs and trained Random Forest models to persist records without frontend breaking changes.
