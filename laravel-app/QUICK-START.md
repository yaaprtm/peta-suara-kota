# ⚡ Quick Start Guide - Peta Suara Kota

## 🚀 First Time Setup

### 1. Clone & Install
```bash
git clone https://github.com/yaaprtm/peta-suara-kota.git
cd peta-suara-kota/laravel-app

# Install PHP dependencies
composer install

# Install Node dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate app key
php artisan key:generate
```

### 2. Database Setup
```bash
# Create SQLite database
touch database/database.sqlite

# Run migrations + seeders
php artisan migrate:fresh --seed
```

### 3. Start Development
```bash
# Terminal 1: PHP server
php artisan serve

# Terminal 2: Vite dev server
npm run dev
```

Visit: http://localhost:8000

---

## 🧪 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Superadmin | admin@petasuarakota.id | password123 |
| Petugas | petugas@surabaya.go.id | password123 |
| Warga | warga@example.com | password123 |

---

## 📝 Common Commands

### Development
```bash
# Run dev server with hot reload
npm run dev

# Check TypeScript errors
npm run typecheck

# Lint code
npm run lint

# Format code
npm run format
```

### Build
```bash
# Production build
npm run build

# Build + test
npm run build && npm run preview
```

### Testing
```bash
# Run PHP tests
php artisan test

# Run specific test
php artisan test --filter=StatsApiTest
```

### Database
```bash
# Reset database
php artisan migrate:fresh --seed

# Just run seeders
php artisan db:seed

# Create migration
php artisan make:migration create_example_table
```

---

## 🗂️ Project Structure

```
laravel-app/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/     # API endpoints
│   │   ├── Middleware/          # Auth, roles
│   │   └── Requests/            # Form validation
│   ├── Models/                  # Eloquent models
│   ├── Services/                # Business logic
│   └── Policies/                # Authorization
├── resources/
│   ├── js/
│   │   ├── Components/          # React components
│   │   │   ├── map/            # Map-related
│   │   │   ├── reports/        # Report forms
│   │   │   └── ui/             # UI components
│   │   ├── Pages/              # Inertia pages
│   │   ├── stores/             # Zustand stores
│   │   ├── i18n/               # Translations
│   │   └── lib/                # Utilities
│   └── css/
│       └── app.css             # Tailwind + custom styles
├── routes/
│   ├── api.php                 # API routes
│   └── web.php                 # Web routes
└── database/
    ├── migrations/             # Database schema
    └── seeders/                # Test data
```

---

## 🎨 Tech Stack

### Backend
- **Laravel 11** - PHP framework
- **Inertia.js** - SPA without API
- **SQLite** - Database (dev)
- **PostgreSQL** - Database (production)

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Zustand** - State management
- **Mapbox GL** - Interactive maps

### Dev Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **PHPUnit** - PHP testing

---

## 🔧 Environment Variables

### Required (.env)
```env
APP_NAME="Peta Suara Kota"
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite

VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

### Optional
```env
# Production storage (S3-compatible)
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_BUCKET=your_bucket
AWS_ENDPOINT=your_endpoint

# Email (production)
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
```

---

## 🐛 Troubleshooting

### Issue: "VITE_MAPBOX_TOKEN not set"
**Solution:** 
1. Get free token from https://account.mapbox.com/
2. Add to `.env`: `VITE_MAPBOX_TOKEN=pk.xxx`
3. Restart `npm run dev`

### Issue: Database error
**Solution:**
```bash
# Reset database
rm database/database.sqlite
touch database/database.sqlite
php artisan migrate:fresh --seed
```

### Issue: Build fails
**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Port already in use
**Solution:**
```bash
# Use different port
php artisan serve --port=8001
```

### Issue: Hot reload not working
**Solution:**
1. Check Vite dev server is running
2. Clear browser cache
3. Restart both servers

---

## 📚 Key Features

### For Warga (Citizens)
- ✅ Submit reports with photos & location
- ✅ Track report status in real-time
- ✅ Upvote important reports
- ✅ View city-wide reports on map
- ✅ Earn badges & points

### For Petugas (Officers)
- ✅ Review & process reports
- ✅ Change report status with notes
- ✅ Filter by urgency & location
- ✅ See statistics & analytics
- ✅ Real-time notifications

### For Superadmin
- ✅ Manage users & roles
- ✅ View system-wide analytics
- ✅ Export reports to CSV/Excel
- ✅ Monitor activity logs
- ✅ Configure system settings

---

## 🚦 API Endpoints

### Public
- `GET /api/stats/overview` - City statistics
- `GET /api/reports` - List reports (with filters)
- `GET /api/reports/{id}` - Report details
- `GET /api/kelurahan` - List kelurahan

### Authenticated
- `POST /api/reports` - Create report
- `PATCH /api/reports/{id}/status` - Update status
- `POST /api/reports/{id}/upvote` - Upvote report

### Admin
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `DELETE /api/admin/users/{id}` - Delete user

---

## 🎯 Performance Tips

1. **Use lazy loading for images:**
   ```tsx
   import LazyImage from '@/Components/ui/LazyImage';
   <LazyImage src="/photo.jpg" alt="Photo" />
   ```

2. **Memoize expensive components:**
   ```tsx
   const MyComponent = React.memo(({ data }) => {
     // ...
   });
   ```

3. **Use virtual lists for >50 items:**
   ```tsx
   import { VirtualList } from '@/Components/ui/VirtualList';
   <VirtualList items={reports} itemHeight={80} />
   ```

4. **Show skeletons while loading:**
   ```tsx
   import { SkeletonList } from '@/Components/ui/Skeletons';
   {isLoading ? <SkeletonList /> : <ReportList />}
   ```

---

## 📖 Documentation

- [PERFORMANCE-OPTIMIZATION.md](./PERFORMANCE-OPTIMIZATION.md) - Performance guide
- [OPTIMIZATION-SUMMARY.md](./OPTIMIZATION-SUMMARY.md) - Optimization report
- [STORAGE-SETUP.md](./STORAGE-SETUP.md) - Storage configuration
- [PRODUCTION-CONFIG.md](./PRODUCTION-CONFIG.md) - Production deployment
- [README.md](./README.md) - Full documentation

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes
3. Run tests: `npm run typecheck && php artisan test`
4. Commit: `git commit -m "feat: add my feature"`
5. Push: `git push origin feature/my-feature`
6. Create Pull Request

---

## 📞 Support

- **Issues:** https://github.com/yaaprtm/peta-suara-kota/issues
- **Discussions:** https://github.com/yaaprtm/peta-suara-kota/discussions

---

**Happy Coding! 🎉**
