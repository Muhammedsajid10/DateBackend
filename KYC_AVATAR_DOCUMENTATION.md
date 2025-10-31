# 📄 COMPLETE KYC & AVATAR VERIFICATION FLOW - API DOCUMENTATION

## 🚀 Overview
Complete KYC (Know Your Customer) verification system with Aadhaar card document upload and avatar selection as the final step of profile completion. This implements the exact flow shown in your mobile app design.

## 📱 Complete Profile Creation Flow

### **1. Language Selection** → **2. Basic Profile** → **3. Voice Verification (Female Users)** → **4. KYC Verification** → **5. Avatar Selection** → **6. Start App!**

---

## 🔄 KYC Verification Process (Steps 1-3)

### **KYC Step 1: Personal Information**

#### `POST /api/kyc/personal-info`
Submit user's personal information for KYC verification.
```json
// Request Body:
{
  "registeredName": "John Doe",
  "mobileNumber": "9876543210",
  "phoneNumber": "+91-9876543210", // Optional
  "emailId": "john.doe@example.com"
}

// Response:
{
  "success": true,
  "message": "Personal information saved successfully",
  "data": {
    "currentStep": 1,
    "completionPercentage": 20,
    "nextStep": {
      "step": 2,
      "name": "bank_details",
      "title": "Bank Details",
      "description": "Provide your bank account information"
    },
    "personalInfo": {
      "registeredName": "John Doe",
      "mobileNumber": "9876543210",
      "emailId": "john.doe@example.com",
      "isComplete": true
    }
  }
}
```

### **KYC Step 2: Bank Details**

#### `POST /api/kyc/bank-details`
Submit bank account information.
```json
// Request Body:
{
  "registeredName": "John Doe",
  "ifscCode": "SBIN0001234",
  "accountNumber": "12345678901234"
}

// Response:
{
  "success": true,
  "message": "Bank details saved successfully",
  "data": {
    "currentStep": 2,
    "completionPercentage": 40,
    "nextStep": {
      "step": 3,
      "name": "document_upload",
      "title": "Upload Documents",
      "description": "Upload front and back images of your Aadhaar card"
    },
    "bankDetails": {
      "registeredName": "John Doe",
      "ifscCode": "SBIN0001234",
      "accountNumber": "****1234" // Masked for security
    }
  }
}
```

### **KYC Step 3: Aadhaar Card Upload**

#### `POST /api/kyc/upload-aadhaar`
Upload Aadhaar card front and back images.
```json
// Form Data:
// document: Image file (JPEG, PNG, WebP)
// documentSide: "front" | "back"

// Response (Single Upload):
{
  "success": true,
  "message": "Aadhaar card front image uploaded successfully",
  "data": {
    "documentSide": "front",
    "isUploaded": true,
    "bothImagesUploaded": false,
    "currentStep": 3,
    "completionPercentage": 60,
    "nextStep": {
      "step": 3,
      "name": "document_upload",
      "title": "Upload Back Image",
      "description": "Upload the back image of your Aadhaar card"
    },
    "uploadedImages": {
      "front": true,
      "back": false
    }
  }
}

// Response (Both Images Uploaded):
{
  "success": true,
  "message": "Aadhaar card back image uploaded successfully",
  "data": {
    "documentSide": "back",
    "isUploaded": true,
    "bothImagesUploaded": true,
    "currentStep": 4,
    "completionPercentage": 80,
    "nextStep": {
      "step": 4,
      "name": "processing",
      "title": "Verification in Progress",
      "description": "We are processing your documents. This may take a few minutes."
    },
    "uploadedImages": {
      "front": true,
      "back": true
    }
  }
}
```

---

## 📊 KYC Status & Verification

### **Get KYC Status**

#### `GET /api/kyc/status`
Get complete KYC verification status and progress.
```json
// Response:
{
  "success": true,
  "data": {
    "verification": {
      "status": "processing", // not_started, personal_info, bank_details, document_upload, processing, verified, rejected
      "currentStep": 4,
      "isComplete": false,
      "submittedAt": "2025-09-19T01:30:00.000Z",
      "verifiedAt": null
    },
    "progress": {
      "completionPercentage": 80,
      "nextStep": {
        "step": 4,
        "name": "processing",
        "title": "Verification in Progress",
        "description": "We are processing your documents. This may take a few minutes."
      }
    },
    "steps": {
      "personalInfo": {
        "isComplete": true,
        "data": {
          "registeredName": "John Doe",
          "mobileNumber": "9876543210",
          "emailId": "john.doe@example.com"
        }
      },
      "bankDetails": {
        "isComplete": true,
        "data": {
          "registeredName": "John Doe",
          "ifscCode": "SBIN0001234",
          "accountNumber": "****1234"
        }
      },
      "documents": {
        "isUploaded": true,
        "isVerified": false,
        "uploadedImages": {
          "front": true,
          "back": true
        },
        "extractedData": {
          "aadhaarNumber": "1234 5678 9012",
          "name": "John Doe",
          "dateOfBirth": "1990-01-01T00:00:00.000Z",
          "gender": "Male",
          "address": "123 Main Street, City, State 123456"
        }
      }
    }
  }
}
```

### **Check Verification Status**

#### `GET /api/kyc/verification-status`
Poll for verification completion status.
```json
// Response (Processing):
{
  "success": true,
  "data": {
    "status": "processing",
    "isComplete": false,
    "isVerified": false,
    "verificationMessage": null,
    "extractedData": {
      "aadhaarNumber": "1234 5678 9012",
      "name": "John Doe"
    },
    "autoVerification": {
      "nameMatch": false,
      "documentQuality": 0,
      "ocrConfidence": 0
    }
  }
}

// Response (Verified):
{
  "success": true,
  "data": {
    "status": "verified",
    "isComplete": true,
    "isVerified": true,
    "verificationMessage": "Document verification successful",
    "extractedData": {
      "aadhaarNumber": "1234 5678 9012",
      "name": "John Doe",
      "dateOfBirth": "1990-01-01T00:00:00.000Z",
      "gender": "Male",
      "address": "123 Main Street, City, State 123456"
    },
    "autoVerification": {
      "nameMatch": true,
      "documentQuality": 92,
      "ocrConfidence": 88,
      "duplicateCheck": false,
      "blacklistCheck": false
    }
  }
}
```

---

## 🎭 AVATAR SELECTION SYSTEM

### **Get Available Avatars**

#### `GET /api/avatars/recommended`
Get avatars filtered by user's gender + neutral options.
```json
// Response:
{
  "success": true,
  "data": {
    "userGender": "Male",
    "categories": [
      {
        "name": "recommended",
        "displayName": "Male Avatars",
        "avatars": [
          {
            "id": "avatar_male_1",
            "name": "Professional Male",
            "category": "male",
            "image": "/avatars/male-professional.svg",
            "thumbnail": "/avatars/male-professional.svg",
            "description": "Business professional look"
          },
          {
            "id": "avatar_male_2",
            "name": "Casual Male",
            "category": "male",
            "image": "/avatars/male-casual.svg",
            "thumbnail": "/avatars/male-casual.svg",
            "description": "Relaxed casual style"
          }
        ]
      },
      {
        "name": "neutral",
        "displayName": "Neutral Avatars",
        "avatars": [
          {
            "id": "avatar_neutral_1",
            "name": "Minimalist",
            "category": "neutral",
            "image": "/avatars/neutral-minimal.svg",
            "thumbnail": "/avatars/neutral-minimal.svg",
            "description": "Clean and simple design"
          }
        ]
      }
    ],
    "totalCount": 7
  }
}
```

### **Select Avatar**

#### `POST /api/avatars/select`
Choose an avatar for the user.
```json
// Request Body:
{
  "avatarId": "avatar_male_1",
  "customizations": {
    "backgroundColor": "#FF5722",
    "borderColor": "#FF9800",
    "effects": ["glow", "shadow"]
  }
}

// Response:
{
  "success": true,
  "message": "Avatar selected successfully",
  "data": {
    "userAvatar": {
      "userId": "user_id_12345",
      "avatar": {
        "id": "avatar_male_1",
        "name": "Professional Male",
        "category": "male",
        "image": "/avatars/male-professional.svg",
        "description": "Business professional look"
      },
      "customizations": {
        "backgroundColor": "#FF5722",
        "borderColor": "#FF9800",
        "effects": ["glow", "shadow"]
      },
      "selectedAt": "2025-09-19T01:35:00.000Z",
      "isComplete": true
    }
  }
}
```

### **Get User's Current Avatar**

#### `GET /api/avatars/my-avatar`
Retrieve user's selected avatar.
```json
// Response:
{
  "success": true,
  "data": {
    "hasAvatar": true,
    "userAvatar": {
      "userId": "user_id_12345",
      "avatar": {
        "id": "avatar_male_1",
        "name": "Professional Male",
        "category": "male",
        "image": "/avatars/male-professional.svg",
        "description": "Business professional look"
      },
      "customizations": {
        "backgroundColor": "#FF5722",
        "borderColor": "#FF9800",
        "effects": ["glow", "shadow"]
      },
      "selectedAt": "2025-09-19T01:35:00.000Z",
      "isComplete": true
    }
  }
}
```

### **Seed Default Avatars (Admin)**

#### `POST /api/avatars/admin/seed`
Create default avatar collection.
```json
// Response:
{
  "success": true,
  "message": "Successfully seeded 11 default avatars",
  "data": {
    "count": 11,
    "avatars": [
      { "id": "avatar_1", "name": "Professional Male", "category": "male" },
      { "id": "avatar_2", "name": "Casual Male", "category": "male" },
      { "id": "avatar_3", "name": "Professional Female", "category": "female" },
      { "id": "avatar_4", "name": "Minimalist", "category": "neutral" }
    ]
  }
}
```

---

## 📋 COMPLETE PROFILE COMPLETION STATUS

### **Get Overall Profile Status**

#### `GET /api/profile/completion-status`
Get complete profile completion including all steps.
```json
// Response:
{
  "success": true,
  "data": {
    "steps": {
      "basicInfo": {
        "isComplete": true,
        "required": true,
        "description": "Complete basic information (name, date of birth, gender)",
        "completedAt": "2025-09-19T01:20:00.000Z"
      },
      "photos": {
        "isComplete": true,
        "required": true,
        "description": "Upload at least one profile photo",
        "completedAt": "2025-09-19T01:22:00.000Z"
      },
      "voiceVerification": {
        "isComplete": true,
        "required": true,
        "description": "Voice verification required for female users",
        "attempts": 2,
        "maxAttempts": 3,
        "canAttempt": true,
        "completedAt": "2025-09-19T01:25:00.000Z"
      },
      "kyc": {
        "isComplete": true,
        "required": true,
        "description": "Complete KYC verification with Aadhaar card documents",
        "completedAt": "2025-09-19T01:32:00.000Z"
      },
      "avatar": {
        "isComplete": true,
        "required": true,
        "description": "Pick your avatar to complete profile setup",
        "completedAt": "2025-09-19T01:35:00.000Z"
      }
    },
    "overall": {
      "isComplete": true,
      "completionPercentage": 100,
      "nextStep": {
        "step": "complete",
        "title": "Profile Complete!",
        "description": "Your profile is complete! You can now use all app features and start connecting.",
        "action": "start_app"
      },
      "completedAt": "2025-09-19T01:35:00.000Z"
    }
  }
}
```

---

## 🔄 Complete Frontend Integration Flow

### **Step-by-Step Implementation:**

#### **1. After Voice Verification (if female) or Photos (if male):**
```javascript
// Check what's next
const response = await fetch('/api/profile/completion-status');
const data = await response.json();

if (data.data.nextStep.step === 'kyc') {
  // Redirect to KYC verification
  navigateToKYCFlow();
}
```

#### **2. KYC Flow Implementation:**
```javascript
// Step 1: Personal Info
const personalInfoData = {
  registeredName: "John Doe",
  mobileNumber: "9876543210",
  emailId: "john@example.com"
};

await fetch('/api/kyc/personal-info', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(personalInfoData)
});

// Step 2: Bank Details
const bankData = {
  registeredName: "John Doe",
  ifscCode: "SBIN0001234",
  accountNumber: "12345678901234"
};

await fetch('/api/kyc/bank-details', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(bankData)
});

// Step 3: Document Upload
const formData = new FormData();
formData.append('document', frontImageFile);
formData.append('documentSide', 'front');

await fetch('/api/kyc/upload-aadhaar', {
  method: 'POST',
  body: formData
});

// Upload back image
const backFormData = new FormData();
backFormData.append('document', backImageFile);
backFormData.append('documentSide', 'back');

await fetch('/api/kyc/upload-aadhaar', {
  method: 'POST',
  body: backFormData
});

// Poll for verification status
const pollVerification = setInterval(async () => {
  const statusResponse = await fetch('/api/kyc/verification-status');
  const statusData = await statusResponse.json();
  
  if (statusData.data.status === 'verified') {
    clearInterval(pollVerification);
    proceedToAvatarSelection();
  } else if (statusData.data.status === 'rejected') {
    clearInterval(pollVerification);
    showRejectionMessage(statusData.data.verificationMessage);
  }
}, 3000); // Check every 3 seconds
```

#### **3. Avatar Selection:**
```javascript
// Get recommended avatars
const avatarsResponse = await fetch('/api/avatars/recommended');
const avatarsData = await avatarsResponse.json();

// Display avatar selection UI
displayAvatarGrid(avatarsData.data.categories);

// Select avatar
const selectAvatar = async (avatarId) => {
  const response = await fetch('/api/avatars/select', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      avatarId: avatarId,
      customizations: {
        backgroundColor: '#FF5722',
        effects: ['glow']
      }
    })
  });
  
  if (response.ok) {
    // Profile complete! Navigate to main app
    navigateToMainApp();
  }
};
```

---

## 🎯 Complete App Flow Summary

### **Profile Creation Journey:**
1. **🌐 Language Selection** → Select preferred language
2. **👤 Basic Profile** → Name, DOB, Gender
3. **📸 Photo Upload** → Profile pictures
4. **🎤 Voice Verification** → Female users only (verify gender authenticity)
5. **📄 KYC Step 1** → Personal information (name, mobile, email)
6. **🏦 KYC Step 2** → Bank details (account info)
7. **📋 KYC Step 3** → Aadhaar card upload (front + back)
8. **⏳ Processing** → Document verification (30-60 seconds)
9. **✅ KYC Verified** → Documents approved
10. **🎭 Avatar Selection** → Pick avatar from personalized collection
11. **🚀 Start App!** → Full access to dating features

### **Male Users:** 9 steps (no voice verification)
### **Female Users:** 10 steps (includes voice verification)

---

**🎉 Your complete KYC + Avatar verification system is now ready! Users will have a comprehensive onboarding experience that ensures authenticity and profile completion before accessing the main dating features.**