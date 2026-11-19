# Production Deployment & Operations Guide
## HostelOS – Enterprise Hostel Management System

---

### 1. Prerequisites
- **Node.js:** v20+ LTS or v22+
- **Package Manager:** `pnpm` v11+
- **Database:** MongoDB Atlas Cluster (M0 Free Tier or Dedicated M10+)
- **Cloud Provider:** Vercel (Next.js Application)
- **Object Storage (Optional):** Cloudinary for complaint attachment storage
- **AI Provider (Optional):** OpenAI API Key (GPT-4o / GPT-4o-mini)

---

### 2. Environment Variables Configuration
Copy `.env.example` to `.env.local` in `hostel-os/`:

```bash
# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="HostelOS"
NODE_ENV="development"

# MongoDB Atlas
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/hostel-os?retryWrites=true&w=majority"

# Auth.js / Custom JWT Key (32+ chars)
AUTH_SECRET="your-32-char-cryptographically-secure-key-here"
AUTH_URL="http://localhost:3000"

# Optional AI Features (Leave blank to use embedded fallback engines)
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o"
```

---

### 3. Database Seeding & Initialization
To initialize all 24 collections with realistic campus data and demo logins for all 5 roles:

```bash
pnpm db:seed
```

This provisions:
- **Admin:** `admin@hostelos.edu` / `Password@123`
- **Warden:** `warden@hostelos.edu` / `Password@123`
- **Student:** `student@hostelos.edu` / `Password@123`
- **Maintenance:** `maintenance@hostelos.edu` / `Password@123`
- **Accountant:** `accountant@hostelos.edu` / `Password@123`
- 2 Sample Hostels ("Aryabhatta Hall of Residence", "Gargi Hall of Residence")
- Buildings, Floors, and Rooms with live pricing
- Sample Complaints, Invoices, Outpasses, and Knowledge Documents for AI RAG

---

### 4. Running the Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 5. Running the Python Predictive Analytics Microservice (Optional)
```bash
cd ai-service
pip install -r requirements.txt
python -m app.main
```
The FastAPI service will run on [http://localhost:8000](http://localhost:8000). If offline, HostelOS automatically switches to its embedded regression model.

---

### 6. Production Build & Verification
```bash
pnpm type-check
pnpm test
pnpm build
```
Deploy directly to Vercel via Git repository link or Vercel CLI.

