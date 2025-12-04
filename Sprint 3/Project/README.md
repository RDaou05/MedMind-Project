# MedMind
A medicine reminder app using Firebase

## Requirements

### Core Features
- User authentication (Firebase Auth)
- Add/edit/delete medications
- Schedule reminders (daily, intervals, PRN)
- Push notifications for medication times
- Log intake (taken/skipped/snoozed)
- Adherence tracking and history
- Refill management with inventory tracking

### User Flows
- **Onboarding**: Permissions, timezone, first medication setup
- **Medication CRUD**: Search drugs, set dosage/schedule, inventory
- **Reminders**: Notification → Take/Snooze/Skip → Log with time/notes
- **History**: Calendar view, adherence stats, export data

### Schedule Types
- Fixed times (8am, 2pm, 8pm)
- Intervals (every 6 hours)
- PRN (as needed, max per day)
- Taper schedules (decreasing doses)
- Specific weekdays
- With meals/bedtime

### Firebase Services
- **Authentication**: User accounts
- **Firestore**: Medication data, schedules, logs
- **Cloud Messaging**: Push notifications
- **Cloud Functions**: Reminder scheduling
- **Storage**: User data backup

### Data Models
```
User: { id, email, timezone, preferences }
Medication: { name, strength, form, color, userId }
Schedule: { medicationId, type, times, days, startDate, endDate }
Reminder: { scheduleId, fireTime, status }
IntakeLog: { medicationId, scheduledTime, actualTime, status, notes }
Inventory: { medicationId, currentQty, threshold }
```

### Technical Requirements
- Mobile app (iOS/Android)
- Offline support with sync
- Local notifications + push notifications
- Encrypted health data storage
- Timezone/DST handling
- Accessibility compliance

### Safety Features
- Drug interaction warnings
- Allergy tracking
- Caregiver sharing
- Emergency contact integration

### MVP Scope
1. User registration/login
2. Basic medication CRUD
3. Simple daily reminders
4. Take/skip logging
5. Adherence calendar view
