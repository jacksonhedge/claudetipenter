# Supabase Integration for TipEnter

This document explains how to set up and use the Supabase integration for user authentication and data storage in TipEnter.

## Overview

TipEnter uses Supabase as its backend service for:

1. User authentication (sign-up, sign-in, password reset)
2. User profile management
3. Receipt data storage
4. Image storage

## Setup Instructions

### Prerequisites

- Supabase account (create one at [supabase.com](https://supabase.com))
- Supabase project with the following configuration:
  - Authentication enabled
  - Database tables created (see schema below)
  - Storage buckets configured

### Installation

1. Install the Supabase JavaScript client:

```bash
npm install @supabase/supabase-js
```

2. Configure your Supabase credentials in `js/services/supabaseService.js`:

```javascript
const SUPABASE_URL = 'https://gmysjdndtqwkjvrngnze.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdteXNqZG5kdHF3a2p2cm5nbnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NzI0MzEsImV4cCI6MjA1OTI0ODQzMX0.3NGSsqVFha767BLiNkbDuv_i_Tp2n_vpcQxVvDLseGM';
```

3. Include the Supabase client in your HTML files:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7"></script>
```

## Database Schema

### Profiles Table

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  role TEXT,
  establishment TEXT,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a secure RLS policy
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);
```

### Receipts Table

```sql
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  customer_name TEXT,
  date TEXT,
  time TEXT,
  check_number TEXT,
  amount TEXT,
  tip TEXT,
  total TEXT,
  payment_type TEXT,
  signed TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a secure RLS policy
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own receipts" 
  ON receipts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own receipts" 
  ON receipts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receipts" 
  ON receipts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receipts" 
  ON receipts FOR DELETE 
  USING (auth.uid() = user_id);
```

## Storage Buckets

Create a storage bucket called `receipt-images` with the following RLS policies:

```sql
-- Allow users to upload their own images
CREATE POLICY "Users can upload their own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    auth.uid() = (storage.foldername(name))[1]::uuid
    AND bucket_id = 'receipt-images'
  );

-- Allow users to view their own images
CREATE POLICY "Users can view their own images"
  ON storage.objects FOR SELECT
  USING (
    auth.uid() = (storage.foldername(name))[1]::uuid
    AND bucket_id = 'receipt-images'
  );
```

## Authentication Component

The `AuthComponent` class in `js/components/authComponent.js` provides a complete user interface for authentication:

- Sign-in form
- Sign-up form
- Password reset form
- User profile display

### Usage

```javascript
import AuthComponent from './js/components/authComponent.js';

// Initialize the auth component
const authComponent = new AuthComponent({
  containerId: 'authContainer',
  onAuthStateChanged: (user) => {
    console.log('Auth state changed:', user);
    // Handle auth state changes
  },
  redirectAfterLogin: 'home.html' // Optional redirect after login
});
```

## Supabase Service

The `supabaseService` in `js/services/supabaseService.js` provides methods for interacting with Supabase:

### Authentication

```javascript
// Sign up
const { success, user, error } = await supabaseService.signUp(email, password, userData);

// Sign in
const { success, user, error } = await supabaseService.signIn(email, password);

// Sign out
const { success } = await supabaseService.signOut();

// Reset password
const { success } = await supabaseService.resetPassword(email);
```

### User Profile

```javascript
// Get user profile
const { success, profile } = await supabaseService.getUserProfile();

// Update user profile
const { success } = await supabaseService.updateUserProfile({
  full_name: 'New Name',
  role: 'manager'
});
```

### Receipt Management

```javascript
// Save receipt
const { success } = await supabaseService.saveReceipt(receiptData);

// Get user's receipts
const { success, receipts } = await supabaseService.getUserReceipts();

// Upload receipt image
const { success, url } = await supabaseService.uploadReceiptImage(file);
```

## iOS App Integration

For iOS app integration, you can use the Supabase Swift client:

```swift
import Supabase

// Initialize the client
let supabase = SupabaseClient(
  supabaseURL: URL(string: "https://gmysjdndtqwkjvrngnze.supabase.co")!,
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdteXNqZG5kdHF3a2p2cm5nbnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NzI0MzEsImV4cCI6MjA1OTI0ODQzMX0.3NGSsqVFha767BLiNkbDuv_i_Tp2n_vpcQxVvDLseGM"
)

// Sign in
let result = try await supabase.auth.signIn(
  email: "user@example.com",
  password: "password123"
)

// Get user profile
let profile = try await supabase
  .from("profiles")
  .select()
  .eq("id", supabase.auth.session?.user.id ?? "")
  .single()
  .execute()

// Save receipt
let receipt = try await supabase
  .from("receipts")
  .insert([
    "user_id": supabase.auth.session?.user.id ?? "",
    "customer_name": "Restaurant Name",
    "amount": "$45.67",
    "tip": "$9.13",
    "total": "$54.80"
  ])
  .execute()
```

## Security Considerations

1. **API Keys**: The anon key included in the client is public and has limited permissions. Secure operations are protected by Row Level Security (RLS) policies.

2. **Data Validation**: Always validate user input on the server side using Supabase's RLS policies.

3. **Authentication**: Use Supabase's built-in authentication system which handles secure password storage and session management.

4. **Storage**: Use the user's ID in the storage path to ensure users can only access their own files.

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Check that your Supabase URL and anon key are correct.

2. **Permission Errors**: Ensure your RLS policies are correctly configured.

3. **CORS Issues**: If you're getting CORS errors, check your Supabase project settings and ensure the correct domains are allowed.

4. **Storage Issues**: Make sure your storage bucket exists and has the correct permissions.

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
