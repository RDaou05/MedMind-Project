# Test Case Planning

## Group members
- Ahil Sarang
- Dylan Crenshaw
- Roni Daou
- Ronit Dixit
- Tianna Carter
- Aidan Makovij

## 1. Use Case 1 - Add New Medication

**Test Case ID:** TC01 - Valid Medication Entry

**Test Objective:** Verify that user can successfully add a new medication with all required fields

**Preconditions:** User is logged in and on the main medication screen

**Test steps:**
1. Click "Add Medication" button
2. Enter medication name "Aspirin"
3. Select dosage form "Pill"
4. Enter strength "81mg"
5. Select schedule type "Daily"
6. Set time to "08:00"
7. Click "Save" button

**Input Values:**
- Name: "Aspirin"
- Form: "Pill"
- Strength: "81mg"
- Schedule: "Daily"
- Time: "08:00"

**Expected results:** Medication is saved successfully and appears in medication list

---

**Test Case ID:** TC02 - Empty Required Fields

**Test Objective:** Verify that system validates required fields when adding medication

**Preconditions:** User is logged in and on the add medication screen

**Test steps:**
1. Leave medication name field empty
2. Select dosage form "Pill"
3. Leave strength field empty
4. Click "Save" button

**Input Values:**
- Name: "" (empty)
- Form: "Pill"
- Strength: "" (empty)

**Expected results:** System displays error message "Please fill in all required fields" and does not save medication

---

**Test Case ID:** TC03 - Duplicate Medication Name

**Test Objective:** Verify that system prevents adding medications with duplicate names

**Preconditions:** User is logged in and already has medication "Aspirin" in their list

**Test steps:**
1. Click "Add Medication" button
2. Enter medication name "Aspirin"
3. Select dosage form "Pill"
4. Enter strength "325mg"
5. Click "Save" button

**Input Values:**
- Name: "Aspirin" (duplicate)
- Form: "Pill"
- Strength: "325mg"

**Expected results:** System displays error message "Medication name already exists" and does not save medication

---

**Test Case ID:** TC04 - Maximum Character Limit

**Test Objective:** Verify that system enforces character limits for medication name

**Preconditions:** User is logged in and on the add medication screen

**Test steps:**
1. Enter medication name with 101 characters
2. Select dosage form "Pill"
3. Enter strength "10mg"
4. Click "Save" button

**Input Values:**
- Name: "A very long medication name that exceeds the maximum allowed character limit of one hundred chars"
- Form: "Pill"
- Strength: "10mg"

**Expected results:** System displays error message "Medication name cannot exceed 100 characters" and does not save medication

## 2. Use Case 2 - Process Medication Reminder

**Test Case ID:** TC05 - Mark Medication as Taken

**Test Objective:** Verify that user can successfully mark medication as taken from notification

**Preconditions:** User has active medication reminder notification displayed

**Test steps:**
1. Open medication reminder notification
2. Click "Taken" button
3. Confirm actual time (default to current time)
4. Click "Confirm" button

**Input Values:**
- Action: "Taken"
- Time: Current timestamp

**Expected results:** Medication is logged as taken, notification disappears, adherence statistics updated

---

**Test Case ID:** TC06 - Snooze Medication Reminder

**Test Objective:** Verify that user can snooze medication reminder for specified duration

**Preconditions:** User has active medication reminder notification displayed

**Test steps:**
1. Open medication reminder notification
2. Click "Snooze" button
3. Select "10 minutes" from snooze options
4. Click "Confirm" button

**Input Values:**
- Action: "Snooze"
- Duration: "10 minutes"

**Expected results:** Notification disappears and reappears after 10 minutes, snooze count incremented

---

**Test Case ID:** TC07 - Skip Medication Dose

**Test Objective:** Verify that user can skip medication dose with optional reason

**Preconditions:** User has active medication reminder notification displayed

**Test steps:**
1. Open medication reminder notification
2. Click "Skip" button
3. Enter reason "Feeling nauseous"
4. Click "Confirm" button

**Input Values:**
- Action: "Skip"
- Reason: "Feeling nauseous"

**Expected results:** Medication is logged as skipped with reason, notification disappears, adherence statistics updated

---

**Test Case ID:** TC08 - Maximum Snooze Limit

**Test Objective:** Verify that system enforces maximum snooze limit per reminder

**Preconditions:** User has already snoozed the same reminder 3 times

**Test steps:**
1. Open medication reminder notification (4th snooze attempt)
2. Click "Snooze" button
3. Select "5 minutes" from snooze options
4. Click "Confirm" button

**Input Values:**
- Action: "Snooze" (4th attempt)
- Duration: "5 minutes"

**Expected results:** System displays message "Maximum snoozes reached. Please take or skip medication" and does not allow snoozing

## 3. Use Case 3 - View Adherence Dashboard

**Test Case ID:** TC09 - Display Adherence Statistics

**Test Objective:** Verify that adherence dashboard displays correct statistics for user's medications

**Preconditions:** User is logged in and has medication intake history for past 7 days

**Test steps:**
1. Navigate to "Adherence" section from main menu
2. View overall adherence percentage
3. Check individual medication adherence rates
4. Verify streak information display

**Input Values:**
- Historical data: 14 taken doses out of 16 scheduled doses

**Expected results:** Dashboard displays 87.5% overall adherence, individual medication rates, and current streak information

---

**Test Case ID:** TC10 - Filter by Date Range

**Test Objective:** Verify that user can filter adherence data by specific date range

**Preconditions:** User is on adherence dashboard with historical data

**Test steps:**
1. Click "Filter" button
2. Select start date "2024-01-01"
3. Select end date "2024-01-07"
4. Click "Apply Filter" button

**Input Values:**
- Start Date: "2024-01-01"
- End Date: "2024-01-07"

**Expected results:** Dashboard updates to show adherence data only for the selected date range

---

**Test Case ID:** TC11 - Export Adherence Report

**Test Objective:** Verify that user can export adherence data as PDF report

**Preconditions:** User is on adherence dashboard with available data

**Test steps:**
1. Click "Export" button
2. Select "PDF" format
3. Select date range "Last 30 days"
4. Click "Generate Report" button

**Input Values:**
- Format: "PDF"
- Range: "Last 30 days"

**Expected results:** System generates PDF report with adherence data and provides download link

---

**Test Case ID:** TC12 - Insufficient Data Message

**Test Objective:** Verify that system displays appropriate message when insufficient data exists

**Preconditions:** User is logged in with less than 3 days of medication history

**Test steps:**
1. Navigate to "Adherence" section from main menu
2. View dashboard content

**Input Values:**
- Historical data: Only 2 days of intake logs

**Expected results:** System displays message "Insufficient data for comprehensive statistics. Continue logging medications for better insights" with available limited data