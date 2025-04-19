# Receipt Approval System for TipEnter

This document explains how to set up and use the Receipt Approval system for TipEnter, which allows administrators to review, approve, or reject receipts and tips submitted by users.

## Overview

The Receipt Approval system adds an administrative workflow to TipEnter that ensures all receipts and tips are reviewed before being finalized. This helps prevent errors, detect fraud, and maintain data quality.

Key features:
- Admin dashboard for reviewing pending receipts
- One-by-one approval or rejection of receipts
- Detailed view of receipt information and images
- Filtering by date range, establishment, and user
- Statistics on pending, approved, and rejected receipts
- Total approved tips calculation
- Configurable settings for auto-approval and notifications

## Setup Instructions

### 1. Database Schema Update

First, you need to update your Supabase database schema to add the necessary columns for the approval workflow. Run the SQL script `update-receipts-schema.sql` in your Supabase SQL editor:

```sql
-- Run the SQL script in your Supabase SQL editor
```

This script adds the following columns to the `receipts` table:
- `approval_status` - Status of the receipt (null for pending, 'approved', or 'rejected')
- `approved_at` - Timestamp when the receipt was approved
- `approved_by` - Email of the user who approved the receipt
- `rejected_at` - Timestamp when the receipt was rejected
- `rejected_by` - Email of the user who rejected the receipt
- `rejection_reason` - Reason for rejection

It also creates database views and functions to make querying easier.

### 2. File Installation

Copy the following files to your project:

1. `admin-receipt-approval.html` - The main HTML file for the receipt approval interface
2. `css/receipt-approval.css` - CSS styles for the receipt approval interface
3. `js/receipt-approval.js` - JavaScript functionality for the receipt approval interface

### 3. Add Link to Admin Dashboard

Add a link to the receipt approval page in your admin dashboard:

```html
<a href="admin-receipt-approval.html" class="admin-nav-item">
    <i class="fas fa-receipt"></i>
    <span>Receipt Approval</span>
</a>
```

### 4. Configure Approval Permissions

By default, users with the role 'admin' or 'manager' have permission to approve or reject receipts. You can modify the RLS policy in Supabase if you need different permissions.

## Using the Receipt Approval System

### Accessing the Approval Dashboard

1. Log in to TipEnter with an admin or manager account
2. Navigate to the Receipt Approval page

### Reviewing Pending Receipts

1. The "Pending Approval" tab shows all receipts waiting for review
2. Click on a receipt in the list to view its details
3. Review the receipt information and image
4. Click "Approve" to approve the receipt or "Reject" to reject it
5. If rejecting, select or enter a reason for rejection

### Viewing Approved and Rejected Receipts

1. Click the "Approved" tab to view all approved receipts
2. Click the "Rejected" tab to view all rejected receipts
3. Use the filters to narrow down the results by date range, establishment, or user
4. Click the "Export" button to export the data to CSV

### Configuring Settings

1. Click the "Settings" tab to access the approval settings
2. Enable or disable auto-approval for receipts below a certain tip amount
3. Configure email notifications for new pending receipts
4. Manage users with approval permissions

## Technical Details

### Database Schema

The receipt approval system uses the following database schema:

```sql
-- Receipts table with approval columns
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
  approval_status TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Row Level Security (RLS)

The system uses Supabase RLS policies to ensure that only authorized users can approve or reject receipts:

```sql
-- Allow admins and managers to update receipt approval status
CREATE POLICY "Admins can update receipt approval status" 
  ON receipts FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin' OR role = 'manager'
    )
  )
  WITH CHECK (
    (approval_status IS NOT NULL) AND
    (auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin' OR role = 'manager'
    ))
  );
```

### JavaScript API

The receipt approval system uses the Supabase JavaScript client to interact with the database:

```javascript
// Approve a receipt
const { error } = await supabaseService.supabase
    .from('receipts')
    .update({
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: currentUser.email
    })
    .eq('id', receiptId);

// Reject a receipt
const { error } = await supabaseService.supabase
    .from('receipts')
    .update({
        approval_status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: currentUser.email,
        rejection_reason: rejectionReason
    })
    .eq('id', receiptId);
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Make sure the user has the 'admin' or 'manager' role in their profile.
2. **Missing Receipts**: Check that the receipts table has been updated with the new columns.
3. **Filter Not Working**: Ensure that the date range is valid and that the establishment and user exist.

### Error Messages

- "Failed to load user data": The user may not have permission to access the approval dashboard.
- "Failed to load receipts": There may be an issue with the database connection or query.
- "Failed to approve/reject receipt": The user may not have permission to update the receipt status.

## Future Enhancements

Planned enhancements for the receipt approval system:

1. Batch approval of multiple receipts
2. Advanced filtering and sorting options
3. Receipt image annotation tools
4. Approval workflow automation based on rules
5. Integration with accounting systems
6. Mobile app support for on-the-go approvals

## Support

For support with the receipt approval system, please contact support@tipenter.com.
