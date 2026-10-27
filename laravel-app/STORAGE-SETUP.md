# S3-Compatible Storage Setup Guide

## Why S3 Storage is Required for Production

**Vercel Serverless Limitations:**
- Serverless functions have **read-only filesystem** after build
- Uploaded files stored locally will be **lost after deployment**
- Each function invocation may run on a different container
- Maximum storage in `/tmp` is limited (512MB) and ephemeral

**Solution:** Use S3-compatible object storage for persistent file uploads.

## Recommended Storage Providers

### 1. Cloudflare R2 (Recommended)

**Pros:**
- ✅ **Free tier**: 10 GB storage, 1 million requests/month
- ✅ **Zero egress fees** (no bandwidth charges)
- ✅ S3-compatible API
- ✅ Fast global CDN
- ✅ Simple pricing: $0.015/GB/month after free tier

**Cons:**
- ⚠️ Requires Cloudflare account

**Setup Steps:**

1. **Create Cloudflare Account**
   - Go to https://dash.cloudflare.com/sign-up
   - Verify email

2. **Create R2 Bucket**
   - Navigate to R2 → Create bucket
   - Bucket name: `peta-suara-kota-surabaya` (must be unique)
   - Location: Automatic (global)

3. **Generate API Token**
   - Go to R2 → Manage R2 API Tokens
   - Click "Create API Token"
   - Permissions: "Object Read & Write"
   - Copy: Access Key ID and Secret Access Key

4. **Configure Public Access (Optional)**
   - Go to bucket Settings → Public Access
   - Connect custom domain or use R2.dev subdomain
   - Example: `https://peta-suara-kota.your-account.r2.dev`

5. **Environment Variables**
   ```env
   FILESYSTEM_DISK=s3
   AWS_ACCESS_KEY_ID=your_r2_access_key_id
   AWS_SECRET_ACCESS_KEY=your_r2_secret_access_key
   AWS_DEFAULT_REGION=auto
   AWS_BUCKET=peta-suara-kota-surabaya
   AWS_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
   AWS_URL=https://peta-suara-kota.your-account.r2.dev
   AWS_USE_PATH_STYLE_ENDPOINT=false
   ```

   **Finding your Account ID:**
   - R2 Dashboard → Right sidebar → Copy Account ID
   - Endpoint format: `https://<account-id>.r2.cloudflarestorage.com`

### 2. AWS S3

**Pros:**
- ✅ Most reliable and feature-rich
- ✅ Industry standard
- ✅ Global availability

**Cons:**
- ⚠️ Egress bandwidth costs (expensive for high traffic)
- ⚠️ More complex pricing

**Pricing:**
- $0.023/GB/month storage
- $0.09/GB egress (bandwidth out)
- Free tier: 5GB storage, 20,000 GET requests for 12 months

**Setup Steps:**

1. **Create AWS Account**
   - Go to https://aws.amazon.com/

2. **Create S3 Bucket**
   - Go to S3 Console → Create bucket
   - Bucket name: `peta-suara-kota-surabaya`
   - Region: `ap-southeast-1` (Singapore - closest to Indonesia)
   - **Uncheck** "Block all public access" if you want public URLs
   - Enable versioning (optional)

3. **Create IAM User**
   - Go to IAM → Users → Add user
   - Username: `peta-suara-app`
   - Attach policy: `AmazonS3FullAccess` or create custom policy
   - Save Access Key ID and Secret Access Key

4. **Configure CORS (if accessed from browser)**
   - Go to bucket → Permissions → CORS
   - Add:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

5. **Environment Variables**
   ```env
   FILESYSTEM_DISK=s3
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   AWS_DEFAULT_REGION=ap-southeast-1
   AWS_BUCKET=peta-suara-kota-surabaya
   AWS_URL=https://peta-suara-kota-surabaya.s3.ap-southeast-1.amazonaws.com
   AWS_USE_PATH_STYLE_ENDPOINT=false
   ```

### 3. DigitalOcean Spaces

**Pros:**
- ✅ Simple pricing: $5/month for 250GB storage + 1TB bandwidth
- ✅ S3-compatible
- ✅ Built-in CDN

**Cons:**
- ⚠️ No free tier

**Setup Steps:**

1. **Create DigitalOcean Account**
   - Go to https://www.digitalocean.com/

2. **Create Space**
   - Spaces → Create Space
   - Region: Singapore (SGP1) - closest to Indonesia
   - Space name: `peta-suara-kota`
   - Enable CDN (recommended)

3. **Generate API Key**
   - API → Tokens/Keys → Spaces Keys
   - Generate New Key
   - Save Key and Secret

4. **Environment Variables**
   ```env
   FILESYSTEM_DISK=s3
   AWS_ACCESS_KEY_ID=your_spaces_key
   AWS_SECRET_ACCESS_KEY=your_spaces_secret
   AWS_DEFAULT_REGION=sgp1
   AWS_BUCKET=peta-suara-kota
   AWS_ENDPOINT=https://sgp1.digitaloceanspaces.com
   AWS_URL=https://peta-suara-kota.sgp1.cdn.digitaloceanspaces.com
   AWS_USE_PATH_STYLE_ENDPOINT=false
   ```

### 4. Backblaze B2

**Pros:**
- ✅ Cheapest storage: $0.005/GB/month (4x cheaper than S3)
- ✅ First 10GB free
- ✅ S3-compatible API

**Cons:**
- ⚠️ Slower than Cloudflare R2 or AWS S3

## Installation

### 1. Install AWS SDK

The package is already added to `composer.json`:

```bash
cd laravel-app
composer install
```

This installs `league/flysystem-aws-s3-v3` package.

### 2. Configure Environment

**Local Development (.env):**
```env
FILESYSTEM_DISK=public
```

**Production (.env on Vercel):**
```env
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_DEFAULT_REGION=auto
AWS_BUCKET=your-bucket-name
AWS_ENDPOINT=your-endpoint-url
AWS_URL=your-public-url
```

### 3. Verify Configuration

Test storage connection:

```bash
php artisan tinker
```

```php
// Test write
Storage::disk('s3')->put('test.txt', 'Hello from Peta Suara Kota');

// Test read
Storage::disk('s3')->get('test.txt');

// Test URL
Storage::disk('s3')->url('test.txt');

// Clean up
Storage::disk('s3')->delete('test.txt');
```

## Usage in Application

### StorageService Helper

The application includes `App\Services\StorageService` that automatically uses the configured disk:

```php
use App\Services\StorageService;

// Upload single file
$path = StorageService::storeFile($request->file('photo'), 'photos');

// Upload multiple files
$paths = StorageService::storeFiles($request->file('photos'), 'photos');

// Get public URL
$url = StorageService::url($path);

// Delete file
StorageService::delete($path);
```

### Automatic Disk Selection

The `StorageService` uses `config('filesystems.default')` which reads from `FILESYSTEM_DISK`:
- Local: Uses `public` disk → `storage/app/public/`
- Production: Uses `s3` disk → S3-compatible storage

**No code changes needed** - just set environment variable!

## File Structure

### Local Development
```
storage/
  app/
    public/
      photos/
        2024/
          12/
            abc123.jpg
      audio/
        2024/
          12/
            xyz789.mp3
```

### Production (S3)
```
s3://your-bucket/
  photos/
    2024/
      12/
        abc123.jpg
  audio/
    2024/
      12/
        xyz789.mp3
```

## Security Best Practices

### 1. Private vs Public Files

**Public files** (photos, audio):
- Stored with `public` visibility
- Accessible via direct URL
- No authentication required

**Private files** (sensitive documents):
- Stored with `private` visibility
- Accessible via temporary signed URLs
- Authentication required

```php
// Store private file
StorageService::storeFile($file, 'private-docs', 'private');

// Generate temporary URL (expires in 1 hour)
$url = StorageService::temporaryUrl($path, 3600);
```

### 2. CORS Configuration

If accessing S3 directly from browser (e.g., pre-signed upload URLs), configure CORS:

**Cloudflare R2:**
- Go to bucket → Settings → CORS Policy
- Add:
```json
[
  {
    "AllowedOrigins": ["https://your-domain.vercel.app"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### 3. API Keys Security

**Never commit API keys to git:**
- ✅ Store in `.env` (local)
- ✅ Store in Vercel Environment Variables (production)
- ❌ Never hardcode in source code
- ❌ Never commit to `.env` to repository

**Rotate keys regularly:**
- Generate new API keys every 6 months
- Revoke old keys after rotation

## Cost Optimization

### 1. Image Optimization

Before upload, optimize images to reduce storage and bandwidth costs:

```php
// Recommended: use intervention/image package
$image = Image::make($file)
    ->resize(1920, 1080, function ($constraint) {
        $constraint->aspectRatio();
        $constraint->upsize();
    })
    ->encode('jpg', 85);

$path = StorageService::storeFile($image, 'photos');
```

### 2. Compression

Compress audio files before upload:
- Convert to MP3 with bitrate 64-128 kbps
- Use OPUS codec for better compression

### 3. CDN (Content Delivery Network)

**Cloudflare R2:**
- Built-in CDN included
- No extra configuration needed

**AWS S3:**
- Use CloudFront for CDN
- Significantly reduces egress costs

**DigitalOcean Spaces:**
- CDN included when enabled
- Edge caching reduces latency

## Monitoring

### Storage Usage

**Cloudflare R2:**
- Dashboard → R2 → Select bucket → Metrics

**AWS S3:**
- S3 Console → Metrics tab
- CloudWatch for detailed monitoring

### Cost Tracking

- Set up billing alerts
- Monitor monthly costs
- Review storage usage regularly

## Troubleshooting

### Issue: "Class 'League\Flysystem\AwsS3V3\AwsS3V3Adapter' not found"
**Solution:** Run `composer install` to install AWS SDK

### Issue: "Credentials could not be loaded"
**Solution:** Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set

### Issue: "The bucket you are attempting to access must be addressed using the specified endpoint"
**Solution:** Check `AWS_ENDPOINT` matches your provider's endpoint URL

### Issue: Files upload but URLs return 404
**Solution:** 
1. Verify bucket is public or CORS is configured
2. Check `AWS_URL` is set to public domain
3. For Cloudflare R2, ensure R2.dev domain is enabled

### Issue: "SignatureDoesNotMatch" error
**Solution:** Verify `AWS_SECRET_ACCESS_KEY` is correct and hasn't been regenerated

## Migration from Local to S3

If you already have files in `storage/app/public/`, migrate them to S3:

```bash
php artisan tinker
```

```php
$localDisk = Storage::disk('public');
$s3Disk = Storage::disk('s3');

// Get all files
$files = $localDisk->allFiles();

// Copy to S3
foreach ($files as $file) {
    $contents = $localDisk->get($file);
    $s3Disk->put($file, $contents);
    echo "Migrated: {$file}\n";
}
```

## Summary

✅ **For Production:**
- Use Cloudflare R2 (recommended - free tier, zero egress)
- Or AWS S3 (most reliable, but more expensive)
- Set `FILESYSTEM_DISK=s3`

✅ **For Local Development:**
- Use `public` disk
- Set `FILESYSTEM_DISK=public`
- Run `php artisan storage:link`

✅ **StorageService:**
- Automatically uses correct disk
- No code changes between environments
- Just configure environment variables

🎯 **Ready for Production** once S3 credentials are configured in Vercel!
