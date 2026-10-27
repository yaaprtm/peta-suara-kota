# Production Configuration Guide

## Critical Production Settings for Serverless (Vercel)

### 🚨 Why Database Drivers are Required

**Serverless environments like Vercel have ephemeral filesystems:**
- Each serverless function invocation may run on a different container
- File storage is read-only after build time
- Any files written during runtime are lost when the function terminates

### Required Configuration

#### 1. Session Driver

**❌ WRONG (will cause session loss):**
```env
SESSION_DRIVER=file
```

**✅ CORRECT:**
```env
SESSION_DRIVER=database
```

**Why:** File-based sessions are stored in `storage/framework/sessions/`. In serverless, this directory is ephemeral and sessions will be lost between requests.

**Migration:** The `sessions` table is already created in `0001_01_01_000000_create_users_table.php`

#### 2. Cache Driver

**❌ WRONG (will cause cache inconsistency):**
```env
CACHE_STORE=file
```

**✅ CORRECT:**
```env
CACHE_STORE=database
```

**Why:** File-based cache is stored in `storage/framework/cache/`. In serverless, each function invocation may have a different cache state.

**Migration:** The `cache` and `cache_locks` tables are created in `0001_01_01_000001_create_cache_table.php`

#### 3. Filesystem Disk (for uploads)

**❌ WRONG (uploads will be lost):**
```env
FILESYSTEM_DISK=local
```

**✅ CORRECT:**
```env
FILESYSTEM_DISK=s3
```

**Why:** Uploaded files (photos, audio) stored in `storage/app/public/` will be lost on each deployment. Use S3-compatible storage (Cloudflare R2, AWS S3, etc.)

**Configuration:** See Task #3 for S3 setup instructions.

### Database Requirements

#### Production Database Options

**Recommended Providers:**
1. **PlanetScale** (MySQL-compatible, free tier available)
   - Automatic backups and branching
   - Serverless MySQL with edge caching
   
2. **Supabase** (PostgreSQL, free tier available)
   - Built-in authentication and real-time features
   - Generous free tier
   
3. **Railway** (MySQL/PostgreSQL)
   - Simple deployment
   - Pay-as-you-go pricing

4. **AWS RDS** (MySQL)
   - Enterprise-grade reliability
   - More expensive

#### Connection Configuration

**Untuk TiDB Cloud (Recommended — digunakan proyek ini):**
```env
DB_CONNECTION=mysql
DB_HOST=gateway01.ap-northeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_DATABASE=peta_suara_kota
DB_USERNAME=your_tidb_username.root
DB_PASSWORD=your_tidb_password
```

> **TLS Otomatis:** `config/database.php` sudah dikonfigurasi untuk mengaktifkan SSL secara otomatis saat `DB_PORT=4000`. Tidak perlu set `MYSQL_ATTR_SSL_CA` secara manual.

> **Buat database:** Di TiDB Cloud dashboard, jalankan `CREATE DATABASE peta_suara_kota;` sebelum migrate.

**Untuk PlanetScale (alternatif):**
```env
DB_CONNECTION=mysql
DB_HOST=aws.connect.psdb.cloud
DB_PORT=3306
DB_DATABASE=your-database-name
DB_USERNAME=your-username
DB_PASSWORD=your-password
```

**Untuk Supabase (PostgreSQL):**
```env
DB_CONNECTION=pgsql
DB_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

### Vercel Environment Variables

Configure these in Vercel Dashboard → Project Settings → Environment Variables:

```
APP_NAME=Peta Suara Kota Surabaya
APP_ENV=production
APP_KEY=base64:your-generated-key
APP_DEBUG=false
APP_URL=https://your-domain.vercel.app

DB_CONNECTION=mysql
DB_HOST=your-db-host
DB_PORT=3306
DB_DATABASE=your-database
DB_USERNAME=your-username
DB_PASSWORD=your-password

SESSION_DRIVER=database
CACHE_STORE=database
FILESYSTEM_DISK=s3

AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=auto
AWS_BUCKET=your-bucket-name
AWS_ENDPOINT=https://your-endpoint.com
AWS_URL=https://your-public-domain.com

VITE_MAPBOX_TOKEN=pk.your-mapbox-token

SANCTUM_STATEFUL_DOMAINS=your-domain.vercel.app
```

### Testing Configuration Locally

Before deploying to production, test with database drivers locally:

1. **Update `.env`:**
   ```bash
   SESSION_DRIVER=database
   CACHE_STORE=database
   ```

2. **Run migrations:**
   ```bash
   php artisan migrate
   ```

3. **Verify sessions table:**
   ```bash
   php artisan tinker
   >>> Schema::hasTable('sessions') // should return true
   >>> Schema::hasTable('cache') // should return true
   ```

4. **Test application:**
   ```bash
   php artisan serve
   ```
   
   Login and verify sessions persist across page refreshes.

### Common Issues

#### Issue: "Session store not set on request"
**Solution:** Ensure `SESSION_DRIVER=database` and migrations are run.

#### Issue: "Cache store [database] is not configured"
**Solution:** Run `php artisan config:cache` to clear cached config.

#### Issue: Sessions work locally but not in production
**Solution:** Verify `SESSION_DRIVER=database` is set in Vercel environment variables, not just `.env`.

#### Issue: Upload files disappear after deployment
**Solution:** Configure S3-compatible storage (see Task #3).

### Performance Considerations

#### Database Session Performance

With database sessions, each request queries the `sessions` table. To optimize:

1. **Index already exists** on `last_activity` column
2. **Garbage collection** runs automatically based on `SESSION_LIFETIME`
3. **Consider Redis** for high-traffic production (requires Redis provider)

#### Database Cache Performance

Database cache queries the `cache` table. To optimize:

1. **Index already exists** on `expiration` column
2. **Use cache tags** to group related cache entries
3. **Set appropriate TTL** for cached data

### Alternative: Redis for High Traffic

If your application grows to >1000 concurrent users, consider Redis:

**Redis Providers:**
- Upstash Redis (serverless, free tier)
- Railway Redis
- AWS ElastiCache

**Configuration:**
```env
SESSION_DRIVER=redis
CACHE_STORE=redis
REDIS_CLIENT=phpredis
REDIS_HOST=your-redis-host.com
REDIS_PASSWORD=your-redis-password
REDIS_PORT=6379
```

**Trade-off:** Redis is faster but requires additional infrastructure and cost.

## Summary

✅ **For Vercel Serverless:**
- SESSION_DRIVER=database (required)
- CACHE_STORE=database (required)
- FILESYSTEM_DISK=s3 (required for uploads)

✅ **Migrations Already Exist:**
- `sessions` table ✓
- `cache` and `cache_locks` tables ✓

✅ **No Code Changes Required:**
- Laravel automatically handles database sessions/cache
- Just configure environment variables

🎯 **Ready for Production** once environment variables are set.
