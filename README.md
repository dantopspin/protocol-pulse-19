# Protocol Log

Create a high-production, polished iOS MOBILE APP with the working title Peptide Lens for people who want to organize, calculate, track, and understand peptide protocols in one precise system.

The app combines protocol scheduling, dose logging, reconstitution calculations, vial inventory, injection-site rotation, progress tracking, side-effect records, educational compound profiles, and an AI assistant grounded in the user’s own data.

The product must include the established free and premium functionality found in leading peptide trackers, but its primary differentiator is a proprietary Protocol Intelligence system:

Protocol Check — checks every logged dose against the active protocol, vial concentration, syringe type, previous entries, schedule, and inventory.
Change Timeline — records every meaningful protocol change and shows what the user recorded before and after it.
Change Impact — produces non-causal before-and-after observations around dose, schedule, vial, compound, or lifestyle changes.
Protocol Handoff — generates a clean, provider-readable summary of the user’s protocol history, changes, symptoms, adherence, inventory, and questions.
The app must feel like a precise personal protocol instrument, not a generic medication tracker, bodybuilding product, playful habit tracker, or soft lifestyle app.

Do not connect RevenueCat yet.

Build the premium architecture, entitlement logic, locked states, plan-selection screen, and paywall UI, but keep subscriptions behind an abstract subscription service that can be connected to RevenueCat later.

For development, include a hidden or clearly labeled developer entitlement switch in Settings that allows the build to preview Free and Pro states locally. Do not scatter hardcoded premium checks throughout the UI. Use one centralized entitlement service.

If any requirement cannot be implemented natively in the current Lovable environment, create the complete interface, data model, adapter, loading state, permission state, empty state, and graceful fallback so the native capability can be connected later without redesigning the product.


Core Product Purpose
The app solves the practical logistics of running and recording peptide protocols:

Remembering what is scheduled
Logging doses accurately
Converting vial concentrations into syringe units
Managing multiple compounds and protocol schedules
Tracking vial depletion
Rotating injection sites
Recording weight, symptoms, side effects, and progress
Understanding what changed over time
Preparing a clear record for a clinician or appointment
Reviewing educational compound information
Asking questions about the user’s own records
The core recurring loop is:

Today → Review scheduled dose → Verify calculation → Log dose → Update vial inventory → Record site or symptoms → Build longitudinal protocol history

The user must be able to complete a standard dose log in under ten seconds once the protocol is configured.

The app must reduce repeated manual entry. A configured protocol, vial, concentration, syringe type, and schedule should automatically populate future logging flows.

The app must not recommend a dose, prescribe a protocol, generate a personalized stack, diagnose a reaction, approve a compound combination, or advise the user to increase or decrease a dose.

It may organize and convert information the user already entered.


Product Positioning
Use this product idea throughout the interface:

Track every dose. Check every change. Understand your history.

Supporting positioning:

Keep your whole protocol in one place.
Convert concentrations without repeating the math.
See what changed and what you recorded afterward.
Prepare a complete history for your next appointment.
Do not use claims such as:

Safer dosing
Prevent overdoses
Guaranteed accuracy
Clinically proven results
Faster weight loss
Better recovery
Medical-grade recommendations
AI doctor
Optimized protocol
Protocol Check identifies internal inconsistencies in user-entered data. It does not determine whether a dose is medically appropriate.


Platform and Technical Direction
Platform: iOS only.

Do not build an Android or web target.

Use native-feeling iOS interaction patterns and respect:

Safe areas
Dynamic Island devices
Home indicator
Dynamic Type
Reduce Motion
Light appearance
System notification permissions
Camera and photo-library permissions
Health permissions where available
Use local-first storage.

Store protocol, dose, vial, symptom, site, metric, and history data on-device using SQLite, AsyncStorage, or the most reliable structured local database available in the environment.

No account or login is required for the first version.

AI calls are a network dependency, but standard tracking, calculator, protocol viewing, inventory, site rotation, and logging must remain functional offline.

Queue AI summaries or analyses locally when offline. Run them when connectivity returns.

Never block dose logging because the AI service or network is unavailable.


Primary Navigation
After onboarding, use five bottom navigation destinations:

Today
Protocols
Calculator
Progress
Library
Use thin-stroke icons and visible text labels.

Do not hide core navigation behind gestures.

Place global Settings and the AI assistant in the top-right area where appropriate.

The primary dose logging action belongs on Today. Do not create an oversized floating button that dominates every screen.


Pages
Splash / Launch

Onboarding — Screen 1: Product Introduction

Onboarding — Screen 2: Primary Objective

Onboarding — Screen 3: Experience Level

Onboarding — Screen 4: Current Compounds

Onboarding — Screen 5: Tracking Difficulties

Onboarding — Screen 6: Units and Equipment

Onboarding — Screen 7: First Protocol Setup

Onboarding — Screen 8: First Vial Setup

Onboarding — Screen 9: Protocol Verification

Onboarding — Screen 10: Disclaimer and Data Preferences

Onboarding — Screen 11: Personalized Today Preview

Today

Dose Logging

Dose Detail

Protocols

Protocol Builder

Protocol Detail

Protocol Change History

Vial Inventory

Vial Detail

Reconstitution Calculator

Saved Calculations

Injection Site Map

Progress Overview

Metrics

Symptoms and Side Effects

Lifestyle Tracking

Change Timeline

Change Impact Report

Weekly Review

Protocol Handoff / Export

Compound Library

Compound Profile

Compound Comparison

Educational Protocol Examples

AI Assistant

Paywall / Upgrade

Settings

Notification Settings

Health Data Settings

Privacy and Data Controls

Static legal pages:

Privacy Policy
Terms of Service
Medical and Educational Disclaimer
About Trace

Onboarding Flow
Onboarding should establish trust, configure one useful protocol, and let the user see a personalized Today screen before presenting premium value.

Keep onboarding focused. Do not collect age, biological sex, goal weight, diet, or other sensitive information unless the app immediately uses it for a clearly visible feature.

Do not request notification, camera, photo-library, or Health permissions at first launch. Ask at the moment the feature becomes relevant.

Screen 1 — Product Introduction
Show the app name and a restrained value statement:

Your protocol, clearly recorded.

Supporting line:

Track doses, calculations, vials, sites, symptoms, and protocol changes in one place.

Primary CTA:

Set up your protocol

Secondary text action:

Explore without setup

Explore without setup opens the free compound library and calculator. The user can begin onboarding later.

Do not use carousels, mascots, illustrations of syringes, lifestyle photography, or testimonial claims on this screen.

Screen 2 — Primary Objective
Question:

What do you need most?

Use a multi-select list:

Keep doses and schedules organized
Check reconstitution calculations
Track vial inventory
Rotate injection sites
Record weight and progress
Connect symptoms to my timeline
Prepare records for appointments
Learn about compounds
Allow multiple selections.

Use the result only to prioritize modules and onboarding explanations. Do not use it to generate dose or protocol recommendations.

Screen 3 — Experience Level
Question:

How familiar are you with protocol tracking?

Options:

New to it
I track manually
I use notes or spreadsheets
I use another tracker
I manage multiple protocols
This controls explanation depth only.

Do not infer medical competence or reduce warnings based on experience.

Screen 4 — Current Compounds
Question:

What are you currently recording?

Provide:

Searchable compound list
Multi-select
Categories
Manual custom entry
“Nothing yet”
“I prefer not to add this now”
Do not present any compound as recommended.

Clearly label profile categories such as:

Approved medication
Compounded medication
Investigational compound
Research compound
Custom entry
Do not imply regulatory approval where none exists.

Screen 5 — Tracking Difficulties
Question:

What usually becomes difficult?

Multi-select:

Remembering scheduled doses
Reconstitution math
Switching between mg, mcg, mL, and units
Managing multiple compounds
Knowing what remains in a vial
Remembering injection sites
Recording side effects
Understanding what changed
Preparing a complete history
Other
Use this information to personalize the first Today screen and feature education.

Screen 6 — Units and Equipment
Configure defaults:

Metric or imperial body measurements
Preferred amount display: mg, mcg, or both
Syringe type
Syringe capacity
U-100 or custom unit scale
Pen, prefilled device, vial, or other administration format
Preferred time format
Always display critical dose values in multiple representations when applicable:

0.25 mg · 250 mcg · 0.05 mL · 5 units

Never silently convert and replace the original user-entered value.

Screen 7 — First Protocol Setup
The user may:

Select a compound from the library
Add a custom compound
Skip protocol setup
Fields:

Protocol name
Compound
User-entered scheduled amount
Amount unit
Frequency
Preferred time
Start date
Optional end date
Optional notes
Source of instructions
Instruction source options:

Prescriber instructions
Clinic instructions
Product label
Personal record
Imported from another tracker
Other
Do not ask the AI to create a schedule or dose.

Supported basic frequencies:

Daily
Specific weekdays
Every number of days
Weekly
Multiple times per week
As recorded, without reminders
Premium frequencies should also be visible but locked where appropriate:

Every other day
Multiple doses per day
Custom intervals
On/off cycles
5-on/2-off
Titration records
Phase-based schedules
Date-specific schedules
Screen 8 — First Vial Setup
This screen appears only when the selected format requires vial tracking.

Fields:

Vial name
Compound
Vial amount
Amount unit
Diluent volume
Diluent type, optional
Reconstitution date
User-entered expiry or discard date
Batch or lot number, optional
Supplier or clinic, optional
Label photo, optional
Storage notes, optional
Syringe type
Allow the user to skip vial tracking and continue with schedule-only logging.

OCR may suggest values from a photographed label, but every extracted critical field must be visibly reviewed and confirmed.

Never silently save OCR-derived dose, vial amount, concentration, expiry, or syringe information.

Screen 9 — Protocol Verification
Present one clear verification summary:

Compound
Scheduled amount
Frequency
Active vial
Vial concentration
Volume per scheduled amount
Syringe units
Syringe type
Projected number of doses
Projected vial run-out date
Show the derivation, not only the final number.

Example:

Vial amount: 10 mg
Diluent added: 2 mL
Concentration: 5 mg/mL
Scheduled amount: 0.25 mg
Draw volume: 0.05 mL
U-100 syringe: 5 units

Require individual confirmation of the critical values before activation.

Actions:

Confirm protocol
Review calculation
Edit vial
Edit schedule
Use plain language:

Confirm that these values match your existing instructions.

Do not say:

Confirm that this dose is safe.

Screen 10 — Disclaimer and Data Preferences
Show a concise, readable disclaimer:

The app organizes user-entered records.
It does not provide medical advice.
It does not recommend doses or combinations.
Calculations depend on the values the user enters.
Users should verify instructions with a qualified healthcare professional.
Urgent or severe symptoms require appropriate medical care, not an app response.
Require an explicit checkbox:

I understand that Trace records and converts information I provide. It does not prescribe or verify medical appropriateness.

Offer privacy preferences:

Keep all records on this device
Allow selected records to be sent for AI summaries
Allow Health data import later
The default should be privacy-preserving.

Screen 11 — Personalized Today Preview
Reveal the configured Today screen with the next scheduled entry.

Example:

Today

BPC-157
8:00 PM
250 mcg · 0.05 mL · 5 units
Vial 01
Last site: lower-right abdomen

Show:

Next scheduled dose
Vial remaining
Site rotation status
One-tap logging preview
Protocol Check explanation
Primary CTA:

Open Today

After the preview, request notification permission with context:

Allow reminders for scheduled entries and low inventory.

Do not request permission before this moment.


Free and Pro Structure
Build all Free and Pro experiences now.

Do not connect RevenueCat.

Create:

SubscriptionService interface
Local mock entitlement provider
Free and Pro feature guards
Upgrade screen
Locked feature explanations
Restore purchase placeholder
Manage subscription placeholder
Monthly and annual plan UI
Developer Free/Pro state switch
Do not make locked features appear broken. Show complete previews with clear value descriptions.

Free Features
Free users receive:

Compound Library
Browse without an account
Search compounds
Filter by category
View basic compound profiles
View mechanism summaries
View half-life information where supported
View research status
View educational references
Save limited favorites
See clear regulatory and evidence labels
Reconstitution Calculator
Enter vial amount
Enter diluent volume
Enter user-supplied target amount
Select syringe type
Convert mg, mcg, mL, and syringe units
Show concentration
Show volume to draw
Show syringe-unit visualization
Show formula and calculation steps
Save a limited number of calculations
The calculator converts a user-entered amount. It never proposes the amount.

Basic Protocol Tracking
One active protocol
Up to three compounds within that protocol
Basic recurring schedules
Today view
Basic reminders
Limited recent history
Dose completion status
Skip and reschedule records
Notes
One active vial per compound
Basic Dose Logging
Scheduled dose logging
Manual unscheduled entry
Amount
Time
Compound
Vial
Site
Notes
Basic reaction entry
Limited history, such as the most recent 30 days
Basic Injection Site Tracking
Front and back body map
Last-used site
Basic recent-site history
User-defined site notes
Basic Inventory
Current vial
Estimated amount remaining
Estimated doses remaining
Reconstitution date
User-entered expiry or discard date
Basic low-stock reminder
Basic Progress
Weight entries
One custom metric
Simple trend chart
Basic adherence percentage
Recent symptom entries
Limited AI
Allow a small number of AI questions or summaries per week.

Free AI may answer:

How the app works
How a displayed calculation was derived
What appears in the user’s recent records
When the user last logged an entry
Basic educational profile questions
It must not recommend doses, stacks, sources, or treatment changes.

Pro Features
Pro unlocks all premium functionality.

Unlimited Protocol Management
Unlimited active and archived protocols
Unlimited compounds
Multi-compound stacks
Protocol templates
Duplicate protocol
Pause and resume
Archive
Complete change history
Multiple administration formats
Custom protocol names
Custom compounds
Advanced Scheduling
Custom weekdays
Multiple doses per day
Every other day
Every number of hours or days
On/off cycles
5-on/2-off patterns
Phase-based schedules
Date-specific exceptions
Titration history
Temporary schedule changes
Travel and timezone adjustments
Planned protocol start and stop periods
Never generate a titration schedule. Record one the user enters.

Complete Dose History
Unlimited history
Editable entries
Audit trail for edits
Missed, skipped, delayed, and rescheduled states
Historical correction
Bulk history view
Search and filtering
Calendar view
Exportable dose records
Editing a historical dose must recalculate affected inventory and clearly display the impact before saving.

Advanced Vial Inventory
Unlimited vials
Multiple active and reserve vials
Automatic depletion after logging
Estimated doses remaining
Projected run-out date
Low-stock alerts
User-defined reorder reminder
Batch and lot fields
Supplier or clinic field
Label photos
Reconstitution history
Storage notes
User-entered expiry or discard date
Vial status: sealed, active, depleted, discarded, archived
Inventory reconciliation
Manual correction with audit history
Do not include vendor discovery, sourcing recommendations, purchasing links, or marketplaces.

Full Injection Site Rotation
Complete body map history
Site usage frequency
Last-used date
Recent-use intensity
Tenderness
Redness
Bruising
Irritation
Lumps
Custom site notes
User-marked unavailable sites
Rotation suggestions based only on recorded usage
Do not claim a site is medically recovered or medically safe.

Use language such as:

This site was used recently. Consider another recorded site.

Advanced Analytics
Adherence charts
Scheduled vs. logged doses
Weight trends
Body metrics
Symptom frequency
Side-effect trends
Site usage patterns
Vial consumption
Weekly and monthly summaries
Streaks
Protocol completion
Change overlays
Dose-change markers
Compound start and stop markers
Exportable reports
Estimated Exposure Visualization
Include estimated compound-level or serum-level trend visualizations only as clearly labeled educational estimates.

Requirements:

Explain the assumptions
Show the half-life source
Show that actual levels vary
Never present the curve as a lab result
Never use it to recommend timing or dose changes
Allow users to hide the feature
Use “estimated exposure” rather than “your serum level” where possible
Weight and Health Metrics
Support:

Weight
Body-fat percentage
Waist measurement
Resting heart rate
Sleep duration
Activity
Custom metrics
Progress photos
Optional Apple Health import
If Apple Health integration is not currently available, build:

HealthDataService adapter
Permission screen
Connected and disconnected states
Data-source labels
Mock preview data isolated from real user data
Manual entry fallback
Symptoms and Side Effects
Allow structured logging of:

Symptom name
Severity
Start time
Duration
Notes
Related dose, optional
Related vial, optional
Related injection site, optional
Photo, optional
Resolved status
Do not diagnose the symptom.

For severe or urgent user-entered symptoms, show a general safety escalation message rather than an AI interpretation.

Lifestyle Tracking
Include optional premium lifestyle modules:

Nutrition entries
Meal photo scanning
Hydration
Sleep
Activity
Recovery notes
Training notes
Appetite
Energy
Mood
Digestion
Meal scanning may estimate meal components for general tracking, but must:

Show that results are estimates
Allow manual correction
Avoid medical nutrition advice
Avoid claiming that a meal is appropriate for a condition or protocol
Lifestyle data should feed Change Timeline and Change Impact only when the user enables it.

Full AI Assistant
The Pro AI assistant may reference:

Protocols
Dose history
Vials
Inventory
Sites
Symptoms
Metrics
Lifestyle records
Protocol changes
Educational library
Saved questions
It may answer:

When did I last use my left thigh?
How many doses were logged from Vial 03?
What changed before I started recording nausea?
Show my weight around my last schedule change.
Why does my inventory estimate not match?
Summarize the last eight weeks.
Explain this reconstitution calculation.
Prepare questions for my next appointment.
Compare my adherence before and after travel.
It must refuse:

What dose should I take?
Should I increase my dose?
What should I stack?
Which compound should I use?
Is this combination safe?
Should I stop taking this?
Is this reaction normal or dangerous?
Where can I buy peptides?
Which supplier should I trust?
How can I use a research compound for treatment?
The refusal should be brief, direct, and useful.

Example:

I cannot recommend a dose or protocol change. Review the instructions you were given or contact a qualified healthcare professional. I can summarize your recorded history for that conversation.

Deeper Educational Library
Pro library features:

Full compound profiles
Research summaries
Mechanisms
Half-life references
Regulatory status
Evidence quality
Commonly reported research or clinical ranges where appropriate
Study citations
Compound comparisons
Saved reading
Notes
Educational protocol examples
Research updates
Any ranges must be:

Clearly sourced
Non-personalized
Labeled educational
Separated from the user’s active protocol
Never presented as instructions
Educational protocol examples must not have an “Add this protocol” action that silently creates a dose schedule.

Users may manually copy fields only after confirming that the example is not a recommendation.

Export and Handoff
Pro users can export:

PDF protocol summary
Detailed PDF report
CSV dose history
CSV metrics
CSV symptoms
JSON full backup
Provider-ready handoff report
Selected date ranges
Additional Pro Benefits
Early feature access
Priority support entry point
Advanced appearance preferences
Unlimited saved calculations
Unlimited photos and attachments
Full historical backups
Travel mode

Core Moat — Protocol Intelligence
Protocol Intelligence is the main product advantage.

Every major part of the app must contribute structured data to one connected longitudinal system.

Do not implement it as a decorative AI summary screen.

It must be supported at the data-model level.

1. Protocol Graph
Represent the user’s history as connected events.

Event types include:

Protocol created
Protocol activated
Protocol paused
Protocol resumed
Compound added
Compound removed
Scheduled amount changed
Schedule changed
Administration method changed
Vial opened
Vial reconstituted
Vial changed
Vial depleted
Vial discarded
Dose scheduled
Dose logged
Dose skipped
Dose delayed
Dose edited
Site used
Site reaction recorded
Symptom recorded
Weight recorded
Health metric imported
Lifestyle entry recorded
Travel period started
Travel period ended
Lab result recorded
Note added
Export generated
Each event must contain:

Unique ID
Event type
Timestamp
Protocol ID
Compound ID, when relevant
Vial ID, when relevant
Dose ID, when relevant
Previous value, when relevant
New value, when relevant
Source
User-entered note
Related attachments
Created-at timestamp
Edited-at timestamp
Audit metadata
This event structure powers:

Change Timeline
Change Impact
AI summaries
Provider reports
Weekly reviews
Historical comparisons
Inventory reconciliation
Protocol Check
2. Protocol Check
Before saving a dose, compare the entry against:

Active protocol
Scheduled compound
Scheduled amount
Amount unit
Vial concentration
Syringe type
Syringe capacity
Expected volume
Previous logged values
Last logged time
Potential duplicate entries
Remaining inventory
Active vial state
Reconstitution history
Recent protocol changes
Protocol Check evaluates internal consistency only.

It does not determine whether the protocol is medically safe.

Protocol Check States
Consistent

The entry matches the current configured protocol.

Display:

Matches your active protocol.

Do not interrupt the user with a modal.

Changed but explainable

The entry differs because the user intentionally selected another vial, amount, site, time, or protocol state.

Display the difference and require confirmation.

Potential mismatch

Examples:

50 units entered where recent entries were 5 units
mg entered where the protocol uses mcg
Volume exceeds configured syringe capacity
Selected vial has a different concentration
Protocol changed but old calculation remains selected
Inventory should already be depleted
Duplicate dose may have been entered
Dose belongs to another protocol
Reconstitution changed without creating a new vial state
Pen units and syringe units appear to be mixed
Display:

Review this entry

Then show the exact fields that differ.

Example:

Your last five entries used 5 units.
This entry uses 50 units.

Check:

Scheduled amount
Vial concentration
Diluent volume
Syringe type
Actions:

Review
Save as entered
Cancel
Never use alarmist language.

Never block the user from preserving a historical record, but require explicit confirmation for a material mismatch.

3. Change Timeline
Create a dedicated chronological view showing meaningful changes alongside outcomes.

Examples:

Amount changed
Schedule changed
Compound added
Compound stopped
New vial started
Reconstitution changed
Travel began
Weight changed
Symptom frequency changed
Adherence changed
Lifestyle metric changed
Use a clean vertical editorial timeline.

Each change entry shows:

Date
Change
Previous state
New state
Related protocol
Metrics recorded before and after
User note
AI-generated observation, when available
Example:

August 5

Scheduled amount changed
250 mcg → 300 mcg

Following 14 days:

Appetite average: 7.1 → 5.4
Nausea entries: 1 → 5
Average weight: 94.6 kg → 92.9 kg
Adherence: 93%
Use non-causal language.

Approved phrases:

Recorded after
Occurred during
Associated in your records
Changed during the same period
Appeared more frequently
Appeared less frequently
Forbidden phrases:

Caused by
Resulted from
Proves
This means
You should change
The dose is working
The protocol is unsafe
4. Change Impact
When the user makes a meaningful change, create an optional observation window.

Ask:

What do you want to watch after this change?

Options:

Weight
Appetite
Energy
Sleep
Nausea
Digestion
Pain
Recovery
Mood
Injection-site reactions
Custom metric
Default comparison periods:

7 days before vs. 7 days after
14 days before vs. 14 days after
30 days before vs. 30 days after
Allow custom periods.

Do not generate an impact report without enough data.

Show:

Not enough records yet

Then explain what is missing.

Each report must show:

The exact change
Comparison periods
Number of records
Missing-data note
Before values
After values
Adherence differences
Relevant confounders recorded by the user
A restrained AI summary
Clear statement that the comparison does not establish causation
5. Protocol Handoff
Generate a provider-readable report for a selected period.

The report should include:

User-defined report title
Date range
Current protocols
Current compounds
User-entered instruction source
Scheduled amounts
Concentration
Volume
Syringe-unit representation
Frequency
Adherence
Missed or delayed entries
Recent changes
Vial and batch history
Symptoms and side effects
Weight and metrics
Injection-site reactions
Lifestyle observations, if enabled
Estimated exposure charts, if selected
Questions the user wants to discuss
Data-source labels
Generated date
Medical disclaimer
Create:

One-page summary
Detailed appendix
PDF preview
Share sheet
Save to Files
Print support where available
The app must never make a diagnosis or recommendation inside the report.


Today Screen
Today is the main recurring screen.

At the top, show:

Date
Current protocol selector
Protocol status
Pro entitlement indicator only when useful
Settings
AI assistant access
Primary sections:

Next Scheduled Entry
Show:

Compound
Scheduled time
Scheduled amount
Multiple unit representations
Active vial
Estimated vial remaining
Last site
Protocol Check status
Actions:

Log dose
Skip
Reschedule
View details
Do not hide Skip.

Today’s Entries
Show all scheduled and manual entries in chronological order.

States:

Upcoming
Due
Logged
Delayed
Skipped
Needs review
Protocol Check Alert
Show only when an inconsistency needs attention.

Use an inline editorial panel, not a red emergency banner.

Inventory
Show:

Active vial
Estimated doses remaining
Projected run-out
Low-stock state
Check-In
Show an inline weekly check-in when due.

Do not show it as a blocking modal.

Recent Change
When a protocol or vial recently changed, show:

Changed 3 days ago

Link to Change Timeline.


Dose Logging Flow
The standard logging flow must be fast.

Pre-fill:

Protocol
Compound
Scheduled amount
Volume
Syringe units
Active vial
Time
Suggested rotation site based on history
Primary action:

Log dose

Expandable fields:

Change amount
Change vial
Change time
Select site
Add note
Add symptom
Add photo
Mark as partial
Mark as skipped
Run Protocol Check before final save.

For a consistent entry, save immediately after one confirmation.

For a mismatch, show a review sheet with exact differences.

After saving:

Update inventory
Update adherence
Add Protocol Graph event
Update site history
Update Today
Queue relevant analytics
Show a restrained confirmation
Confirmation copy:

Dose logged

No confetti.

No streak celebration animation.

No emoji.


Reconstitution Calculator
The calculator is a central free acquisition feature.

Inputs:

Vial amount
Vial amount unit
Diluent volume
User-supplied target amount
Target amount unit
Syringe type
Syringe capacity
Custom syringe scale
Outputs:

Concentration
Volume to draw
Syringe units
Visual plunger position
Estimated doses per vial
Formula
Calculation steps
Example:

10 mg ÷ 2 mL = 5 mg/mL
0.25 mg ÷ 5 mg/mL = 0.05 mL
0.05 mL on a U-100 syringe = 5 units

Always preserve the original values.

Support:

mg
mcg
mL
units
custom concentration
multi-compound blends
pen concentration
prefilled devices
For blends, show each component separately.

Never infer a target dose.

Never pre-fill a common dose from the library.

Allow:

Save calculation
Attach to protocol
Attach to vial
Duplicate
Export
View history
Require review before overwriting an active protocol calculation.


Protocol Builder
Protocol creation fields:

Name
Compounds
Administration format
Scheduled amount
Amount unit
Schedule
Start date
End date
Reminder
Active vial
Instruction source
Notes
Metrics to watch
Symptoms to watch
Support stacks without visually implying that combined use is recommended.

Each compound in a stack keeps independent:

Amount
Unit
Schedule
Vial
Site history
Inventory
Calculation
Reminder
Change history
A stack is an organizational container, not a clinical recommendation.


Vial Inventory
Inventory states:

Sealed
Active
Low
Depleted
Discarded
Archived
Vial list should show:

Name
Compound
Batch
Reconstitution date
Amount remaining
Estimated doses remaining
Expiry or discard date
Active protocol
Status
Vial detail should show:

Full calculation
Dose history
Inventory adjustments
Label photo
Batch
Supplier or clinic
Storage notes
Reactions recorded during usage
Protocols connected to the vial
Audit trail
Inventory mismatch example:

Review vial balance

This vial should contain approximately 12 mg based on recorded entries.
The manually entered balance is 8 mg.

Actions:

Keep calculated balance
Use manual balance
Review dose history

Injection Site Map
Use a clean front and back anatomical map.

Do not make it photorealistic.

Support custom user-defined sites.

Each site shows:

Last used
Number of recent uses
Connected compounds
Tenderness
Redness
Bruising
Irritation
Lumps
Notes
Photos, optional
User-marked unavailable state
Suggested-site logic may deprioritize:

Recently used sites
User-marked unavailable sites
Sites with recent reactions
It must not claim medical suitability.


Progress and Analytics
Progress should combine:

Adherence
Weight
Body metrics
Symptoms
Side effects
Protocol changes
Vial changes
Lifestyle records
Injection-site reactions
Estimated exposure
Progress photos
Views:

7 days
30 days
90 days
Custom
Entire protocol
Allow event overlays on charts.

Example overlays:

Amount changed
New vial
Compound started
Compound stopped
Travel
Missed period
Side effect
Progress photo
Charts must remain readable and restrained.

Do not use decorative gradients.

Do not present correlation as causation.


Weekly Review
Pro users receive a weekly protocol review.

Sections:

Scheduled entries
Logged entries
Adherence
Delayed or skipped entries
Vial usage
Inventory warnings
Weight and metric changes
Symptoms
Site rotation
Protocol changes
Data needing review
Questions to consider for an appointment
Example copy:

This week

6 of 7 scheduled entries were logged.
One vial was opened.
Average weight decreased by 0.7 kg.
Nausea was recorded twice after the schedule change.
One inventory mismatch needs review.

Do not say that a change caused an outcome.


Compound Library
Library categories may include:

GLP-1 and incretin-related
Recovery
Growth-hormone secretagogues
Metabolic research
Body composition
Longevity and research
Approved medications
Investigational compounds
Custom compounds
Each profile should contain:

Name
Alternate names
Category
Regulatory status
Research status
Mechanism summary
Half-life information
Administration formats described in sources
Educational ranges where legally and editorially appropriate
Commonly researched outcomes
Known limitations
Safety context
Reference list
Last reviewed date
Evidence quality
AI summary
Save action
Compare action
Do not provide sourcing.

Do not allow community vendor ratings.

Do not use fabricated studies or citations.

If real content is not yet connected, build polished placeholder profiles clearly marked as sample content.


AI Assistant Architecture
The AI assistant must be grounded in structured app data.

Do not send the entire database for every question.

Use retrieval based on:

Relevant date range
Relevant protocol
Relevant compound
Relevant events
Relevant metric
Relevant library sources
Clearly distinguish:

User-entered record
Calculated value
Imported Health value
AI-generated observation
Educational source
Every answer about user history should be traceable to visible records.

Include a View records used action.

AI System Prompt Rules
Apply these rules directly to every AI-generated:

Protocol summary
Weekly review
Change Impact report
Handoff summary
Educational summary
AI chat answer
Notification draft
Calculation explanation
System style instruction:

Write in a terse, direct, second-person imperative style. Use no exclamation marks. Use no emoji. Avoid motivational filler, praise, jokes, conversational enthusiasm, or clinical certainty. Prefer short sentences. Use plain language. State uncertainty directly.

Additional safety instruction:

Do not prescribe, recommend, design, optimize, or modify a dose, schedule, compound combination, cycle, titration, or treatment. Do not diagnose symptoms. Do not assess whether a user’s dose is medically appropriate. Do not recommend a source or supplier. When asked for medical direction, refuse briefly and offer to summarize the user’s recorded history or educational sources for discussion with a qualified healthcare professional.

Observation instruction:

Describe temporal associations only. Use phrases such as “recorded after,” “appeared during,” or “changed in the same period.” Never claim that one event caused another.

Data instruction:

Do not invent missing records. Do not fill gaps with assumed doses. State when the available data is incomplete.


Notifications
Notification categories:

Scheduled Entry
Scheduled now: [compound]

Body:

Review the active protocol before logging.

Upcoming Entry
Optional reminder before a scheduled time.

Missed or Unlogged Entry
Do not use guilt language.

Use:

Review yesterday’s schedule

Body:

Log, skip, or reschedule the entry.

Low Inventory
Vial inventory is running low

Body:

Approximately [number] recorded doses remain.

Do not link to purchasing.

Vial Date
Review Vial 03

Body:

The user-entered discard date is approaching.

Weekly Review
Your weekly protocol review is ready

Check-In
Record this week’s changes

Appointment Preparation
Prepare your protocol summary

All notification categories must be independently configurable.

Support timezone changes.

Travel mode should ask whether to preserve:

Home-time schedule
Destination-time schedule
Elapsed interval
Never silently change the schedule after timezone travel.


Paywall
The paywall should appear contextually after the user has experienced free value.

Good triggers:

Creating a second protocol
Adding more than three compounds
Opening Change Impact
Viewing full history
Adding another vial
Opening advanced analytics
Exporting a provider report
Using unlimited AI
Activating a complex schedule
Do not block the free calculator or library behind onboarding.

Paywall structure:

Headline:

See the complete protocol history

Value points:

Check every entry against your protocol
Understand changes over time
Track unlimited protocols and vials
Prepare complete reports
Ask questions about your own records
Plan UI:

Annual
Monthly
Include:

Continue
Restore purchases
Terms
Privacy
Close
Do not connect purchase actions yet.

Use SubscriptionService placeholder actions.

Developer mode may locally grant Pro.

Do not advertise a free trial unless it will actually exist when RevenueCat is connected.


Global Interaction Rules
Tapping outside a text field dismisses the keyboard.

Every text field should provide a Done action where appropriate.

Every destructive action requires a specific confirmation sheet.

Examples:

Delete Protocol 02

This removes its schedule, dose history, vial connections, symptoms, and timeline events from this device.

Actions:

Keep protocol
Delete protocol
Never use a generic “Are you sure?”

Support swipe-down dismissal for sheets.

Use large touch targets.

Do not make users depend on tiny icons for critical actions.

Show units beside every amount.

Never display an unlabeled number in a dose, vial, or calculation context.


Motion
Use React Native Reanimated, Moti, or the most appropriate native-compatible animation system.

Do not use web-only Framer Motion.

Respect Reduce Motion.

Use:

Ease-out transitions
150–250 ms duration
Subtle content fades
Direct positional changes
Progressive chart reveal
Clear state transitions
Do not use:

Bounce
Elastic springs
Confetti
Pulsing celebration
Floating particles
Playful loading mascots
Excessive shimmer
When a protocol change is saved, animate the exact changed value.

Example:

250 mcg → 300 mcg

When inventory updates, animate the numeric balance rather than replacing the entire card.

When Change Impact becomes available, reveal the comparison rows progressively.

Motion communicates data change, not personality.


Design
Visual Direction
Light, Modern Editorial Minimalism adapted for a precise peptide protocol product.

The app should feel like:

A carefully designed scientific journal
A premium personal health record
A precise laboratory notebook
A restrained data product
An editorial publication with interactive tools
It should not feel like:

A generic medication reminder
A bodybuilding forum
A supplement marketplace
A playful wellness tracker
A neon biohacking dashboard
A hospital portal
A social network
A crypto app
Color
Primary background:

#FAFAF7

Secondary surface:

#F2F2ED

Primary text:

#11110F

Secondary text:

#64645D

Hairline:

#D8D8D0

Single accent:

Deep mineral blue #284A68

Use the accent only for:

Active state
Progress
Selected item
Interactive link
Confirmed state
Chart emphasis
Warnings should use a restrained muted amber.

Critical safety escalation may use a muted red, but red must never be the dominant product color.

No gradients.

No neon colors.

No decorative color coding by compound.

Do not give every compound a bright custom color.

Typography
Use:

SF Pro Display for headlines
SF Pro Text for body copy
SF Mono or tabular numerals for concentrations, amounts, dates, and calculations
Headlines:

Semibold or bold
Tight tracking
Strong editorial hierarchy
Body:

Regular or medium
1.4–1.5 line height
Short paragraphs
High legibility
Use tabular numerals for:

mg
mcg
mL
units
remaining inventory
dates
times
percentages
chart values
Maximum three visible text sizes on one screen whenever possible.

Shape Language
Use low-radius or square containers.

Preferred radius:

0–4 pt

Avoid pill-shaped cards and oversized rounded rectangles.

Use 1 px hairline rules as the primary structural element.

Avoid drop shadows.

Use spacing and typography to establish hierarchy.

Buttons may use a subtle 2–4 pt radius but must not look soft or playful.

Spacing
Minimum horizontal page padding:

24 pt

Minimum spacing between major sections:

32 pt

Use generous vertical whitespace.

Do not default every component to 16 px spacing.

Dense data screens may use tighter internal rows while retaining broad page margins.

Iconography
Use thin-stroke line icons with a consistent weight.

Prefer words and typographic labels over decorative icons.

Use icons only for:

Navigation
Edit
Add
Search
Filter
Export
Settings
Camera
Information
History
Do not use molecule graphics as a repeated decorative motif.

Do not use needle imagery in the logo.

Imagery
The product should rely on:

Typography
Data
Structured diagrams
Body map
Syringe visualization
Charts
Label photos uploaded by the user
Avoid generic stock images of laboratories, doctors, fitness models, or injections.


Copy Tone
All interface and AI copy must be:

Terse
Direct
Calm
Precise
Second-person imperative where an action is required
Nonjudgmental
Non-celebratory
Non-alarmist
Use:

Review this entry.
Confirm the active vial.
Log today’s dose.
Add a note.
Compare the last 14 days.
Prepare your report.
Check the calculation.
Record what changed.
Do not use:

Great job
You crushed it
Let’s go
Stay on track
Your peptide journey
Biohack your life
Unlock your potential
Amazing progress
Don’t forget your shot
Oops
Uh-oh
No exclamation marks.

No emoji anywhere:

Interface
AI responses
Notifications
Empty states
Error messages
Marketing copy inside the app
Paywall
Reports

Empty States
Empty states must explain the next useful action.

Examples:

No Protocol
No active protocol

Add an existing schedule to populate Today.

Action:

Add protocol

No Dose History
No entries recorded

Log a scheduled or manual entry to build your timeline.

No Change Impact
No comparison available

Record a protocol change and enough surrounding data to create a comparison.

No Inventory
No active vial

Add a vial to estimate remaining doses.

No Symptoms
No symptoms recorded

Add an entry only when there is something useful to remember.

Avoid illustrations and motivational filler.


Error and Offline States
Standard tracking must remain functional offline.

When AI is unavailable:

Summary unavailable

Your records are saved. Generate the summary when a connection returns.

When a Health integration fails:

Health data was not imported

Review permissions or continue with manual entries.

When a calculation is missing required values:

Add the vial amount and diluent volume

Do not show generic “Something went wrong” unless no specific explanation exists.

Never discard user-entered data after an error.


Data Models
Lock structured data models before building dependent screens.

Compound
{
id,
name,
alternate_names,
category,
regulatory_status,
research_status,
mechanism_summary,
half_life_value,
half_life_unit,
half_life_source,
educational_ranges,
evidence_quality,
references,
last_reviewed_at,
is_custom
}

Protocol
{
id,
name,
status,
compounds,
instruction_source,
start_date,
end_date,
notes,
created_at,
updated_at,
archived_at
}

ProtocolCompound
{
id,
protocol_id,
compound_id,
administration_format,
scheduled_amount,
amount_unit,
schedule_rule,
preferred_times,
active_vial_id,
reminder_settings,
started_at,
stopped_at
}

Vial
{
id,
compound_id,
protocol_ids,
name,
status,
original_amount,
amount_unit,
diluent_volume_ml,
concentration,
reconstitution_date,
user_expiry_date,
batch_number,
supplier_or_clinic,
label_photo_uri,
storage_notes,
estimated_remaining_amount,
manual_remaining_amount,
created_at,
depleted_at,
archived_at
}

DoseLog
{
id,
protocol_id,
protocol_compound_id,
compound_id,
vial_id,
scheduled_entry_id,
scheduled_amount,
actual_amount,
amount_unit,
volume_ml,
syringe_units,
syringe_type,
injection_site_id,
scheduled_at,
logged_at,
status,
notes,
attachment_uris,
protocol_check_result,
created_at,
updated_at
}

SymptomEntry
{
id,
name,
severity,
started_at,
duration,
resolved_at,
related_protocol_id,
related_compound_id,
related_dose_id,
related_vial_id,
related_site_id,
notes,
attachment_uris,
created_at
}

MetricEntry
{
id,
metric_type,
value,
unit,
recorded_at,
source,
source_record_id,
notes
}

SiteRecord
{
id,
site_key,
used_at,
compound_id,
dose_id,
tenderness,
redness,
bruising,
irritation,
lump,
unavailable,
notes,
attachment_uris
}

ProtocolEvent
{
id,
event_type,
protocol_id,
compound_id,
vial_id,
dose_id,
timestamp,
previous_value,
new_value,
source,
notes,
attachment_uris,
created_at,
updated_at
}

ChangeObservation
{
id,
protocol_event_id,
tracked_metrics,
before_period,
after_period,
before_summary,
after_summary,
record_counts,
missing_data,
ai_observation,
generated_at
}

EntitlementState
{
tier: "free" | "pro",
source: "developer" | "subscription_service",
expires_at,
last_verified_at
}


Privacy and Data Controls
Treat all protocol and health-related data as sensitive.

Provide:

Local-first storage
Clear AI data-sharing preference
Export all data
Delete individual protocol
Delete individual vial
Delete individual symptom
Delete all data
Clear AI conversation history
Disconnect Health integration
Remove imported Health data
Remove attachments
Privacy Policy
Medical Disclaimer
Do not use protocol data for advertising.

Do not sell data.

Do not include ad SDKs.

Do not create public profiles.

Do not include social sharing by default.

Exports should require an explicit user action.


Static Legal and Safety Pages
Create polished static pages for:

Medical and Educational Disclaimer
Explain that the app:

Records user-entered information
Performs mathematical conversions
Shows educational content
Does not provide medical advice
Does not prescribe
Does not verify medical appropriateness
Does not diagnose
Does not replace professional care
Depends on accurate user inputs
Privacy Policy
Explain local storage, optional AI processing, optional Health access, export, deletion, and data retention.

Terms of Service
Cover acceptable use, user responsibility for entered values, educational use, service limitations, and subscription placeholders.

About Trace
Explain the product as a protocol organization and personal history tool.

Do not describe it as a treatment platform.


Accessibility
Support Dynamic Type through at least Large accessibility size.

Do not truncate:

Compound names
Calculation results
Warning explanations
Protocol change descriptions
AI answers
Report summaries
Use sufficient contrast.

Do not rely on color alone for status.

Every chart must provide a text summary.

Every body-map site must have an accessible text label.

Every icon-only action must have an accessibility label.

Touch targets must meet iOS accessibility guidance.


Build Priority Order
Core local data models
Onboarding
Today
Basic protocol builder
Dose logging
Reconstitution calculator
Protocol Check
Vial inventory
Basic injection-site map
Compound library
Progress and symptoms
Protocol Graph events
Change Timeline
Change Impact
Weekly Review
Protocol Handoff and export
Pro gating and paywall UI
AI assistant grounded in user records
Advanced scheduling
Estimated exposure visualization
Lifestyle tracking
Health integration adapter
Travel mode
Settings, privacy, and legal pages
Final accessibility and offline QA
The entire product depends on data integrity.

Prioritize:

Correct unit conversion
Reliable local persistence
Timezone-safe schedules
Historical audit trails
Inventory recalculation
Explicit units
Clear free and premium states
Graceful offline behavior
Safe AI boundaries
Do not prioritize decorative animation, social features, or broad lifestyle modules before the protocol, calculator, dose, vial, and history systems are dependable.

The first release should already contain the complete navigation and data architecture for every described feature, even when lower-priority integrations use adapters or polished placeholder states.

The defining product experience is:

Configure an existing protocol. See the next entry clearly. Check the calculation. Log it quickly. Preserve every change. Understand the complete history.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/704e63d6-ca40-484c-a295-077030580fb0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
