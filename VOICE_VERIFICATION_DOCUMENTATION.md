# 🎤 VOICE VERIFICATION FEATURE - API DOCUMENTATION

## 📋 Overview
Voice verification system specifically for **female users** during profile creation. After selecting "Female" as gender, users must complete voice verification to ensure profile authenticity and prevent fake accounts.

## 🎯 Key Features
- **Gender-Specific**: Only required for female users
- **Voice Analysis**: Analyzes voice characteristics to verify gender
- **Multiple Attempts**: Up to 3 attempts per user
- **Real-time Processing**: Voice analysis completes in 30-60 seconds
- **Profile Gating**: Must complete before accessing full app features
- **Security**: Prevents fake female profiles

---

## 🔗 API Endpoints

### 1. **Voice Verification Requirements**

#### `GET /api/voice-verification/requirements`
Check if voice verification is required for current user
```json
// Response:
{
  "success": true,
  "data": {
    "isRequired": true,
    "isCompleted": false,
    "isVerified": false,
    "attempts": 1,
    "maxAttempts": 3,
    "canAttempt": true,
    "requirements": {
      "reason": "Voice verification is required for female users to ensure profile authenticity",
      "audioFormat": "MP3, WAV, M4A, AAC, OGG, or WebM",
      "duration": "2-15 seconds",
      "quality": "Clear speech in quiet environment",
      "fileSize": "Maximum 10MB"
    }
  }
}
```

### 2. **Get Verification Phrase**

#### `GET /api/voice-verification/phrase`
Get random phrase to record
```json
// Response:
{
  "success": true,
  "data": {
    "phrase": "What is your favourite flower?",
    "instructions": [
      "Please record yourself saying the phrase clearly",
      "Speak in a quiet environment with minimal background noise",
      "Use your natural speaking voice",
      "Recording should be 3-10 seconds long",
      "Make sure your microphone is working properly"
    ]
  }
}
```

### 3. **Upload Voice for Verification**

#### `POST /api/voice-verification/upload`
Upload voice recording for analysis
```json
// Form Data:
// voiceFile: Audio file (MP3, WAV, M4A, AAC, OGG, WebM)
// phrase: "What is your favourite flower?" (optional)
// deviceInfo: "iPhone 12" (optional)
// recordingEnvironment: "quiet" | "moderate" | "noisy"

// Response:
{
  "success": true,
  "message": "Voice uploaded successfully. Analysis in progress...",
  "data": {
    "verificationId": "verification_id_12345",
    "status": "processing",
    "estimatedTime": "30-60 seconds"
  }
}
```

### 4. **Check Verification Status**

#### `GET /api/voice-verification/status/:verificationId`
Check current status of voice verification
```json
// Response (Processing):
{
  "success": true,
  "data": {
    "status": "processing",
    "isVerified": false,
    "confidence": 0,
    "detectedGender": "unknown",
    "canRetry": true,
    "attemptsRemaining": 2
  }
}

// Response (Success):
{
  "success": true,
  "data": {
    "status": "verified",
    "isVerified": true,
    "confidence": 87,
    "detectedGender": "female",
    "canRetry": false,
    "attemptsRemaining": 2,
    "result": {
      "status": "success",
      "message": "Voice verification successful",
      "confidence": 87
    }
  }
}

// Response (Failed):
{
  "success": true,
  "data": {
    "status": "failed",
    "isVerified": false,
    "confidence": 65,
    "detectedGender": "male",
    "canRetry": true,
    "attemptsRemaining": 1,
    "failureReason": "voice_gender_mismatch",
    "message": "Voice characteristics do not match selected gender. Please ensure you are speaking clearly.",
    "result": {
      "status": "failed",
      "message": "Voice characteristics do not match selected gender. Please ensure you are speaking clearly.",
      "canRetry": true
    }
  }
}
```

### 5. **Retry Verification**

#### `POST /api/voice-verification/retry`
Prepare for new verification attempt
```json
// Response:
{
  "success": true,
  "message": "Ready for new verification attempt",
  "data": {
    "attemptsRemaining": 2,
    "phrase": "My voice is unique and this is my verification"
  }
}
```

### 6. **Profile Completion Status**

#### `GET /api/profile/completion-status`
Get overall profile completion including voice verification
```json
// Response:
{
  "success": true,
  "data": {
    "steps": {
      "basicInfo": {
        "isComplete": true,
        "required": true,
        "description": "Complete basic information (name, date of birth, gender)"
      },
      "photos": {
        "isComplete": true,
        "required": true,
        "description": "Upload at least one profile photo"
      },
      "voiceVerification": {
        "isComplete": false,
        "required": true,
        "description": "Voice verification required for female users",
        "attempts": 1,
        "maxAttempts": 3,
        "canAttempt": true
      }
    },
    "overall": {
      "isComplete": false,
      "completionPercentage": 67,
      "nextStep": {
        "step": "voiceVerification",
        "title": "Voice Verification Required",
        "description": "Female users must complete voice verification to ensure profile authenticity",
        "action": "voice_verification",
        "attemptsRemaining": 2
      }
    }
  }
}
```

---

## 🔄 Complete Profile Creation Flow

### **For Female Users:**

1. **Language Selection** → User selects preferred language
2. **Basic Profile Info** → Enter name, date of birth, **select "Female"**
3. **🎤 Voice Verification** → **MANDATORY STEP** for female users
   - Get verification phrase
   - Record voice saying the phrase
   - Upload audio file
   - Wait for analysis (30-60 seconds)
   - Receive verification result
4. **Photo Upload** → Add profile pictures
5. **Complete** → Access full app features

### **For Male Users:**
1. **Language Selection** → User selects preferred language  
2. **Basic Profile Info** → Enter name, date of birth, select "Male"
3. **Photo Upload** → Add profile pictures *(No voice verification required)*
4. **Complete** → Access full app features

---

## 🎵 Voice Analysis Details

### **What the System Analyzes:**
- **Fundamental Frequency (F0)**: 165-280 Hz typical for female voices
- **Spectral Centroid**: Higher frequencies in female voices
- **Pitch Range**: Voice pitch variation patterns
- **Speech Clarity**: Audio quality assessment
- **Background Noise**: Environment quality check

### **Verification Criteria:**
- **Gender Match**: Voice characteristics match selected gender
- **Confidence Level**: Minimum 75% confidence required
- **Audio Quality**: Clear speech, minimal background noise
- **Duration**: 2-15 seconds of valid speech
- **Phrase Accuracy**: Optional speech-to-text verification

### **Failure Reasons:**
- `voice_gender_mismatch`: Voice doesn't match female characteristics
- `poor_audio_quality`: Audio too unclear or noisy
- `background_noise`: Too much environmental noise
- `insufficient_speech`: Not enough speech detected
- `technical_error`: System processing error
- `manual_review_required`: Borderline case needs human review

---

## 📱 Frontend Integration Guide

### **Step 1: Check Requirements**
```javascript
// Check if voice verification is needed
const response = await fetch('/api/voice-verification/requirements');
const data = await response.json();

if (data.data.isRequired && !data.data.isCompleted) {
  // Show voice verification screen
  showVoiceVerificationScreen();
}
```

### **Step 2: Get Phrase and Record**
```javascript
// Get verification phrase
const phraseResponse = await fetch('/api/voice-verification/phrase');
const phraseData = await phraseResponse.json();

// Display phrase to user
displayPhrase(phraseData.data.phrase);

// Record audio using browser MediaRecorder API
const audioBlob = await recordAudio(); // Your recording implementation
```

### **Step 3: Upload and Monitor**
```javascript
// Upload recorded audio
const formData = new FormData();
formData.append('voiceFile', audioBlob, 'voice.webm');
formData.append('recordingEnvironment', 'quiet');

const uploadResponse = await fetch('/api/voice-verification/upload', {
  method: 'POST',
  body: formData
});

const uploadData = await uploadResponse.json();
const verificationId = uploadData.data.verificationId;

// Poll for results
const pollStatus = setInterval(async () => {
  const statusResponse = await fetch(`/api/voice-verification/status/${verificationId}`);
  const statusData = await statusResponse.json();
  
  if (statusData.data.status === 'verified') {
    clearInterval(pollStatus);
    showSuccessMessage();
    proceedToNextStep();
  } else if (statusData.data.status === 'failed') {
    clearInterval(pollStatus);
    showFailureMessage(statusData.data.message);
    if (statusData.data.canRetry) {
      showRetryOption();
    }
  }
}, 2000); // Check every 2 seconds
```

---

## 🔐 Security & Privacy

### **Data Protection:**
- Voice recordings stored securely for 7 days only
- Automatic deletion after verification completion
- No voice data shared with third parties
- Encrypted file transmission and storage

### **Anti-Fraud Measures:**
- Maximum 3 attempts per user
- Device fingerprinting to prevent multiple accounts
- IP tracking for suspicious patterns
- Manual review for borderline cases

### **User Privacy:**
- Voice analysis is automated and anonymous
- No human listens to recordings during normal processing
- Users can contact support if verification fails repeatedly
- Clear explanation of why verification is required

---

## ⚠️ Error Handling

### **Common Error Responses:**

#### **Not Required (Male User):**
```json
{
  "success": false,
  "message": "Voice verification is only required for female users"
}
```

#### **Already Verified:**
```json
{
  "success": false,
  "message": "Voice verification already completed"
}
```

#### **Max Attempts Reached:**
```json
{
  "success": false,
  "message": "Maximum verification attempts reached. Please contact support."
}
```

#### **Invalid Audio File:**
```json
{
  "success": false,
  "message": "Only audio files are allowed!"
}
```

#### **Audio Too Short/Long:**
```json
{
  "success": false,
  "message": "Audio must be between 2-15 seconds long"
}
```

---

## 🎯 Success Metrics

### **Expected Verification Rates:**
- **First Attempt Success**: ~75% for genuine female users
- **Second Attempt Success**: ~85% cumulative
- **Third Attempt Success**: ~92% cumulative
- **False Positive Rate**: <5% (males passing as females)
- **False Negative Rate**: <8% (females failing verification)

### **Performance Targets:**
- **Analysis Time**: 30-60 seconds average
- **Uptime**: 99.5% availability
- **File Processing**: <10MB files in <30 seconds
- **User Satisfaction**: >90% successful completion rate

---

**🎉 Voice verification is now fully integrated into your dating app's profile creation flow! Female users will complete this step after selecting their gender and before uploading photos.**