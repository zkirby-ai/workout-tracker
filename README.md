# Workout Tracker

A highly customized, mobile-first workout tracker for a push/pull split.

## MVP
- Show the programmed workout for today
- Let Boss log sets in real time
- Start an automatic rest timer after each completed set
- Use different timer defaults based on exercise severity

## Core product rules

### 1. Daily workout view
The app should clearly show all exercises scheduled for the current training day.

### 2. Set logging
Each exercise should let the user quickly log:
- weight
- reps
- completed set number

### 3. Embedded rest timer
After a set is marked complete, start a rest timer automatically.

Suggested defaults:
- light / isolation: 60s
- moderate: 90s
- heavy compound: 180s

These should be configurable per exercise.

## Product goals
- very fast in the gym
- large tap targets
- dark mode first
- one-handed mobile use
- minimal friction

## Initial architecture
- Next.js app
- TypeScript
- local mock data first
- later: Supabase for persistence + auth if needed

## Initial screens
- Today
- Schedule
- History
- Exercise detail / logging flow

## Data model sketch
- workout_days
- exercises
- planned_exercises
- planned_sets
- completed_sets
- rest_presets

## First milestones
1. App shell + design system
2. Mock push/pull program
3. Set logging interactions
4. Rest timer behavior
5. Persistence
