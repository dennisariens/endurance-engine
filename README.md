# Endurance Engine — Working Product Repo

Working name only. This product is Dennis-owned and intentionally not branded as ColdDesert.

## Purpose

A local-first endurance performance system for athletes who must race from a fixed calendar while still building aerobic capacity, managing recovery, and tracking race cost.

The core rule:
Scheduled races are fixed. Do not block race participation unless injury or illness is present. If racing is suboptimal but mandatory, switch to damage-control and recovery-optimization mode.

## MVP

1. Import/read race calendar
2. Import/read Intervals.icu snapshots
3. Calculate race cost
4. Adapt daily recommendation around fixed races
5. Show dashboard:
   - today status
   - next race
   - race block status
   - fatigue/recovery baseline
   - recent race cost
   - Zone 2 guidance
   - calendar with add/block options

## Current source of truth

Brain prototype:
`~/ColdDesert/brain/endurance/`

This repo is the productization layer. It should not require the ColdDesert brain long-term.

## Status

Planning scaffold created. No live API integration in app yet.
