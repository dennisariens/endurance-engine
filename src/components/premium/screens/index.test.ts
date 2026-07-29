import { describe, expect, it } from 'vitest'
import * as screens from './index'

describe('premium screen module barrel', () => {
  it('exports every lazy-loaded premium screen', () => {
    expect(screens.HomeScreen).toEqual(expect.any(Function))
    expect(screens.PerformanceScreen).toEqual(expect.any(Function))
    expect(screens.RacesScreen).toEqual(expect.any(Function))
    expect(screens.TrainingScreen).toEqual(expect.any(Function))
    expect(screens.RecoveryScreen).toEqual(expect.any(Function))
    expect(screens.GoalsScreen).toEqual(expect.any(Function))
    expect(screens.AiCoachScreen).toEqual(expect.any(Function))
    expect(screens.SettingsDataScreen).toEqual(expect.any(Function))
  })
})
