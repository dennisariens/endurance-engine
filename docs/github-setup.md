# GitHub Setup

## Recommendation

Do not create GitHub remote until product name is chosen.

Local repo name for now:
`endurance-engine`

Possible final repo names:
- aerion
- racecraft
- pacecraft
- formstate
- aerostack

## Private repo command later

```bash
gh repo create <final-name> --private --source=. --remote=origin --push
```

## Public repo command later

Only after product direction is stable:

```bash
gh repo create <final-name> --public --source=. --remote=origin --push
```

## Secrets

Never commit Intervals.icu API key.
Use `.env.local`:

```env
INTERVALS_ICU_API_KEY=...
INTERVALS_ICU_ATHLETE_ID=i478692
```
