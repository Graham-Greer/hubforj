# Component Build Order

## Purpose

This document prevents the app from building abstractions in the wrong order.

The wrong order creates brittle abstractions, prop sprawl, and duplicate design language.

## Build order

1. tokens and global contracts
2. primitives
3. UI controls
4. patterns
5. sections
6. route compositions

## Rules

### Tokens and global contracts first

Before building reusable visuals, define:

- color system
- spacing scale
- typography scale
- radius scale
- motion tokens
- semantic surface/text/border contracts
- theme/template application model

### Primitives before UI

Build primitives only when they express real foundational structure.

Do not skip primitives if a repeated low-level pattern is emerging.

### UI before patterns

If multiple patterns need the same control or small display object, standardize the UI component before building more patterns around duplicated markup.

### Patterns before sections

Public-site sections should compose existing patterns and UI where possible. Sections should not invent their own lower-level language if a reusable pattern already exists.

### Routes last

Route files should be the last place composition happens, not the first place abstraction begins.

## Transitional exceptions

A temporary route-local implementation is acceptable only when:

- the abstraction is not yet proven,
- duplication is not yet meaningful,
- and the temporary code is unlikely to become canonical accidentally.

If the same route-local pattern appears twice, it should be reviewed for extraction.

## Anti-patterns

Do not:

- build large patterns before UI building blocks exist
- build sections that duplicate unregistered patterns
- build route-specific shells instead of proper shell patterns
- introduce “utility components” that are really one-off route fragments in disguise
