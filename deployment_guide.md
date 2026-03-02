# Nivaro Health Deployment Guide

This guide provides the exact steps needed to deploy the Nivaro Health Operating Infrastructure to a production environment (Vercel + Firebase).

## 1. Firebase Project Setup

### A. Create Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it `Nivaro Health`.
3. Disable or Enable Google Analytics depending on your privacy requirements.

### B. Setup Authentication
1. Go to **Build > Authentication > Get Started**.
2. Click **Sign-in method** and enable **Email/Password**.

### C. Setup Firestore Database
1. Go to **Build > Firestore Database > Create Database**.
2. Select **Production Mode** and choose a location closest to your users.
3. **Deploy the Security Rules**:
    - Open the [firestore.rules](file:///c:/Users/ashee/Downloads/NIVARO-HEALTH/firestore.rules) file in this project.
    - **Copy all its content**.
    - Go to your [Firebase Console](https://console.firebase.google.com/) > **Firestore Database** > **Rules** tab.
    - **Paste** the content there, replacing everything.
    - Click **Publish**.

---

## 2. Infrastructure Configuration

### A. Client-Side Config (Environment Variables)
In Vercel or your local `.env.production` file, set the following keys from your **Firebase Project Settings > General > Your Apps (Web Add)**:

| Key | Value Source |
| :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `measurementId` |

### B. Admin SDK Config (Critical for User Creation)
To allow the system to create secure users (Doctors/Operators), you must generate a service account:
1. Go to **Project Settings > Service accounts**.
2. Click **Generate new private key**.
3. Open the downloaded `.json` file and set these environment variables:

| Key | JSON Field Value |
| :--- | :--- |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | `client_email` |
| `FIREBASE_ADMIN_PRIVATE_KEY` | `private_key` (Include the full key with headers) |

---

## 3. Database Indexes

Firestore requires **Composite Indexes** for complex clinical queries. Create these in **Firestore > Indexes > Composite**:

| Collection | Fields | Query Scope |
| :--- | :--- | :--- |
| `patients` | `nodeId` (Asc), `name` (Asc) | Collection |
| `consultations` | `nodeId` (Asc), `createdAt` (Desc) | Collection |
| `consultations` | `nodeId` (Asc), `status` (Asc), `createdAt` (Desc) | Collection |
| `consultations` | `doctorId` (Asc), `status` (Asc), `updatedAt` (Desc) | Collection |

---

## 4. Vercel Deployment

1. Push your code to a GitHub repository.
2. Link the repository to [Vercel](https://vercel.com/import).
3. Under **Environment Variables**, paste all the keys from Step 2.
4. Click **Deploy**.

## 5. Mobile Installation (Android & iOS)
The Nivaro Health platform is a **Progressive Web App (PWA)**, meaning users can install it directly on their home screens for a native app experience.

### A. iOS (iPhone/iPad)
1. Open the deployed URL in **Safari**.
2. Tap the **Share** button (box with an upward arrow).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add** in the top-right corner.

### B. Android
1. Open the deployed URL in **Chrome**.
2. Tap the **Three Dots (⋮)** in the top-right corner.
3. Tap **Install App** or **Add to Home Screen**.
4. Confirm the installation.

## 6. Operational Verification
Once deployed, perform these steps to ensure system integrity:
1. Navigate to your live landing page.
2. Click **Governance Portal** (Login).
3. Log in with your primary Admin account (You may need to manually create the first admin user in the Firestore `users` collection with `role: "ADMIN"`).
4. Verify you can create a new **Doctor** and **Operator** in the user management section.
5. **Mobile Test**: Login via an Android or iOS device and verify the bottom navigation bar appears.
