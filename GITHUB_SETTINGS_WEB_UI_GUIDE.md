# GitHub Settings Web UI Configuration Guide

## 📋 Complete Step-by-Step Instructions for Web Browser

This guide provides detailed instructions for updating GitHub-side Frasberg repository metadata using the GitHub web interface (no CLI required).

**Estimated Time: 5-10 minutes**

---

## 🔐 Prerequisites

- ✅ GitHub account with admin access to the repository
- ✅ Web browser (Chrome, Firefox, Safari, Edge)
- ✅ Logged into GitHub

---

## Step 1: Update Repository Description (2 minutes)

### Location
**URL:** https://github.com/FrasbergAI/frasberg/settings/general

### Instructions

1. **Navigate to Settings**
   - Go to https://github.com/FrasbergAI/frasberg
   - Click the **Settings** tab (near the top right)
   - You'll be on the **General** settings page

2. **Find the About Section**
   - On the right sidebar, look for the **About** section
   - OR scroll down on the main settings page to find the description field

3. **Edit Description**
   - Click the **pencil/edit icon** next to the current description
   - Clear the existing text
   - Paste the new description:
   ```
   Behavioral governance engine for Frasberg. Includes tonal modulation, hinge logic, membrane protocol, and runtime enforcement modules. Used across Emerald Estates® and Orbit systems for identity-preserving conversational output.
   ```

4. **Save Changes**
   - Click **Save** or **Update repository**
   - You should see a success message

### ✅ Verification
- The description on the main repository page updates immediately
- Check: https://github.com/FrasbergAI/frasberg (should show new description)

---

## Step 2: Make Repository Private (3 minutes)

### Location
**URL:** https://github.com/FrasbergAI/frasberg/settings/danger

### ⚠️ Important Notes
- This change is **irreversible** without GitHub support
- Private repositories are hidden from public searches
- Only invited collaborators can access it

### Instructions

1. **Navigate to Danger Zone**
   - Go to https://github.com/FrasbergAI/frasberg/settings
   - Scroll down to the bottom to find the **Danger Zone** section (red/pink background)

2. **Click "Change repository visibility"**
   - In the Danger Zone, find the button labeled **"Change repository visibility"**
   - Click it
   - A dialog box will appear

3. **Select "Make private"**
   - In the dialog, you'll see radio button options
   - Select **"Make this repository private"**
   - Read the warning message carefully
   - A text field will appear asking you to confirm

4. **Confirm by Typing Repository Name**
   - Type exactly: `frasberg`
   - This is a safety measure to prevent accidental changes

5. **Click "I understand, change repository visibility"**
   - The button will only be enabled after you type the correct name
   - Click the confirmation button
   - The page will process the change (30 seconds to a few minutes)

### ✅ Verification
- Repository URL will no longer be searchable
- The lock icon 🔒 will appear next to the repository name
- The visibility badge changes from "Public" to "Private"
- Only collaborators can access: https://github.com/FrasbergAI/frasberg

---

## Step 3: Disable Forking (2 minutes)

### Location
**URL:** https://github.com/FrasbergAI/frasberg/settings/general

### Instructions

1. **Navigate to Features Section**
   - Go to https://github.com/FrasbergAI/frasberg/settings/general
   - Scroll down to find the **Features** section (below the About section)

2. **Locate the Forking Checkbox**
   - In the Features section, you'll see a checkbox for **"Allow forking"**
   - It should currently be **checked** (enabled)

3. **Uncheck the Box**
   - Click the checkbox to **uncheck** it
   - The checkbox will be marked as disabled

4. **Save Changes**
   - The change saves automatically
   - You should see a confirmation message

### ✅ Verification
- The checkbox remains unchecked
- Users will no longer see the "Fork" button on the repository
- The "Networks" tab may disappear or show "no networks"

---

## Step 4: Verify All Changes (1 minute)

### Check Repository Settings

1. **View Repository Main Page**
   - Go to https://github.com/FrasbergAI/frasberg
   - Verify the new description is displayed
   - Confirm the **lock icon** 🔒 is visible (private indicator)
   - Confirm there's **no "Fork" button** in the top toolbar

2. **Check Settings Page**
   - Go to Settings: https://github.com/FrasbergAI/frasberg/settings
   - Verify:
     - ✅ Description shows the current Frasberg text
     - ✅ Repository visibility is **Private**
     - ✅ "Allow forking" checkbox is **unchecked**

### ✅ Final Verification Checklist

- [ ] Description updated to Frasberg version
- [ ] Repository is PRIVATE (lock icon visible)
- [ ] Fork button is hidden (forking disabled)
- [ ] Only collaborators can access the repository
- [ ] Settings page reflects all changes

---

## Step 5: Update Existing Release Metadata (2-5 minutes)

### Why this is manual
- Existing release titles and descriptions are GitHub metadata, not repository files
- A pull request cannot retroactively rename releases that are already published

### Instructions
1. Go to https://github.com/FrasbergAI/frasberg/releases
2. Open each published release that still shows `Frasberg` or `Frasberg`
3. Click **Edit**
4. Update the title and any active branding in the release body to `Frasberg`
5. Keep historical context only if it is clearly labeled as historical

### ✅ Verification
- The Releases page shows `Frasberg` branding for active release titles
- No release title on the repository homepage still shows `Frasberg` or `Frasberg`

---

## Step 6: Rename Repository (OPTIONAL - 2 minutes)

### ⚠️ Important Notes
- This will change the repository URL
- Old URLs will redirect for a period but eventually break
- You MUST update local git remotes
- CI/CD pipelines and webhooks may break

### Instructions

1. **Navigate to Settings**
   - Go to https://github.com/FrasbergAI/frasberg/settings/general
   - Scroll to the top

2. **Find Repository Name Field**
   - You'll see a text field with the current repository name: `frasberg`

3. **Change the Name**
   - Clear the field
   - Enter the new name: `frasberg`

4. **Click "Rename"**
   - The button appears next to the name field
   - Click it to confirm
   - GitHub will process the rename

5. **Update Local Git Remote** (on your computer)

   Open terminal/command prompt and run:
   ```bash
   git remote set-url origin https://github.com/FrasbergAI/frasberg.git
   ```

   Verify the change:
   ```bash
   git remote -v
   ```

### ✅ Verification
- Repository URL changes to: `https://github.com/FrasbergAI/frasberg`
- Old URLs redirect to new URL (for a period)
- Local git remote is updated
- All commits and history are preserved

---

## 📋 Summary Checklist

### Required Steps
- [ ] Step 1: Description updated to Frasberg text
- [ ] Step 2: Repository is now PRIVATE
- [ ] Step 3: Forking is DISABLED
- [ ] Step 4: All changes verified

### Required Manual Branding Steps
- [ ] Step 1: Description updated to Frasberg text
- [ ] Step 5: Existing release metadata updated

### Optional Steps
- [ ] Step 6: Repository renamed to `frasberg`

---

## 🚨 Troubleshooting

### "Change repository visibility" button is grayed out
**Solution:**
- You may not have admin permissions
- Contact repository owner for access
- Or use the GitHub CLI method with proper authentication

### Can't rename repository
**Solution:**
- Ensure you have admin permissions
- Check for active webhooks or workflows that might prevent rename
- Try again after 5 minutes if a change is in progress

### Fork button still visible after disabling forking
**Solution:**
- Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Log out and log back in
- Wait 5-10 minutes for the change to propagate

### Private repository still searchable
**Solution:**
- Private repositories don't appear in public search but may appear if you're logged in
- The setting has taken effect correctly
- Public GitHub search will not find it

---

## 🎯 After Configuration Complete

### What Changed
✅ Repository is now **PRIVATE** - only invited users can access
✅ Forking is **DISABLED** - prevents external copies
✅ Description updated to **Frasberg** branding
✅ (Optional) Repository renamed to **frasberg**

### Next Steps
1. Update project documentation linking to new repository
2. Inform team members of privacy changes
3. Verify CI/CD pipelines still work
4. Test deployment with new repository name (if renamed)
5. Deploy Frasberg AI to production

---

## 📞 Support

For issues:
1. Check troubleshooting section above
2. Review official GitHub documentation: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features
3. Contact GitHub Support if settings fail to apply

---

**Frasberg AI Repository Configuration Complete!** 🎉