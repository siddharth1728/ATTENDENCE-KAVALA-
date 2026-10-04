import React, { useState } from 'react'
import type { CategoryAttendance, ScenarioPreset } from '../types'
import {
  calculateCustomWhatIf,
  calculateScenario,
  deriveStatus,
  formatPercent,
  formatSignedPoints,
} from '../engine'
import { StatusIndicator } from './StatusIndicator'

interface WhatHappensNextProps {
  data: CategoryAttendance
}

export const WhatHappensNext: React.FC<WhatHappensNextProps> = ({ data }) => {
  const [selectedPreset, setSelectedPreset] = useState<ScenarioPreset>('1')

  // Custom scenario inputs
  const [customUpcoming, setCustomUpcoming] = useState<number>(6)
  const [customAttend, setCustomAttend] = useState<number>(4)
  const [customMiss, setCustomMiss] = useState<number>(2)

  if (!data.hasRecordedData) {
    return null
  }

  const presets: { id: ScenarioPreset; label: string }[] = [
    { id: '1', label: 'Next class' },
    { id: '3', label: '3 classes' },
    { id: '5', label: '5 classes' },
    { id: '10', label: '10 classes' },
    { id: 'custom', label: 'Custom' },
  ]

  // Calculate preset outcome via engine
  const presetNumber = Number(selectedPreset) || 1
  const outcome = calculateScenario(data.attended, data.held, presetNumber)

  // Calculate custom what-if via engine
  const customOutcome = calculateCustomWhatIf(
    data.attended,
    data.held,
    customUpcoming,
    customAttend,
    customMiss,
    data.target,
  )

  const attendAllStatus = deriveStatus(outcome.attendAllPercentage, data.target)
  const missAllStatus = deriveStatus(outcome.missAllPercentage, data.target)

  return (
    <section className="app-card scenario-card" aria-labelledby="scenario-heading">
      <div className="section-eyebrow" id="scenario-heading">
        WHAT HAPPENS NEXT?
      </div>

      {/* Preset selector pills */}
      <div
        className="scenario-selector-scroll"
        role="tablist"
        aria-label="Upcoming class scenarios"
      >
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            role="tab"
            aria-selected={selectedPreset === preset.id}
            className={`scenario-pill ${selectedPreset === preset.id ? 'active' : ''}`}
            onClick={() => setSelectedPreset(preset.id)}
            id={`preset-btn-${preset.id}`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Mode A: Preset comparison */}
      {selectedPreset !== 'custom' ? (
        <div className="preset-scenario-content">
          <div className="scenario-section-subtitle">
            {presetNumber === 1 ? 'NEXT CLASS' : `NEXT ${presetNumber} CLASSES`}
          </div>

          <div className="impact-cards-row">
            {/* Attend all */}
            <div className="impact-card card-attend">
              <div className="impact-card-header">
                <span className="impact-card-title">
                  <span className="impact-dot safe" aria-hidden="true" />
                  Attend {presetNumber === 1 ? 'next class' : `next ${presetNumber}`}
                </span>
                <StatusIndicator status={attendAllStatus} size="sm" />
              </div>
              <div
                className="impact-percentage-val safe"
                id="scenario-attend-percentage"
              >
                {formatPercent(outcome.attendAllPercentage)}
              </div>
              <div className="impact-ratio-subtext">
                {data.attended + presetNumber} / {data.held + presetNumber} classes
              </div>
              <div className="impact-delta-tag safe">
                {formatSignedPoints(outcome.attendAllDiff)}
              </div>
            </div>

            {/* Miss all */}
            <div className="impact-card card-miss">
              <div className="impact-card-header">
                <span className="impact-card-title">
                  <span className="impact-dot danger" aria-hidden="true" />
                  Miss {presetNumber === 1 ? 'next class' : `next ${presetNumber}`}
                </span>
                <StatusIndicator status={missAllStatus} size="sm" />
              </div>
              <div
                className="impact-percentage-val danger"
                id="scenario-miss-percentage"
              >
                {formatPercent(outcome.missAllPercentage)}
              </div>
              <div className="impact-ratio-subtext">
                {data.attended} / {data.held + presetNumber} classes
              </div>
              <div className="impact-delta-tag danger">
                {formatSignedPoints(outcome.missAllDiff)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Mode B: Custom WHAT IF scenario */
        <div
          className="custom-scenario-box"
          aria-label="Custom attendance scenario calculator"
        >
          <div className="custom-box-header">
            <span className="custom-title">WHAT IF?</span>
            <span className="custom-subtitle">
              Simulate any upcoming classes and test attendance
            </span>
          </div>

          <div className="custom-input-grid">
            <div className="custom-input-col">
              <label htmlFor="custom-upcoming-input" className="custom-input-label">
                Upcoming classes
              </label>
              <input
                id="custom-upcoming-input"
                type="number"
                min="0"
                className="custom-number-field"
                value={customUpcoming}
                onChange={(e) => setCustomUpcoming(Number(e.target.value) || 0)}
              />
            </div>

            <div className="custom-input-col">
              <label htmlFor="custom-attend-input" className="custom-input-label text-safe">
                Classes I will attend
              </label>
              <input
                id="custom-attend-input"
                type="number"
                min="0"
                className="custom-number-field"
                value={customAttend}
                onChange={(e) => setCustomAttend(Number(e.target.value) || 0)}
              />
            </div>

            <div className="custom-input-col">
              <label htmlFor="custom-miss-input" className="custom-input-label text-danger">
                Classes I will miss
              </label>
              <input
                id="custom-miss-input"
                type="number"
                min="0"
                className="custom-number-field"
                value={customMiss}
                onChange={(e) => setCustomMiss(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          {!customOutcome.isValid ? (
            <div className="custom-error-banner" role="alert" id="custom-scenario-error">
              <span className="error-icon" aria-hidden="true">
                ⚠️
              </span>
              <span>{customOutcome.errorMessage}</span>
            </div>
          ) : (
            <div className="custom-result-card">
              <div className="custom-result-left">
                <span className="custom-result-label">Result:</span>
                <div className="custom-result-metric-row">
                  <strong
                    className={`custom-result-pct ${
                      customOutcome.status === 'SAFE' ? 'text-safe' : 'text-danger'
                    }`}
                    id="custom-projected-percentage"
                  >
                    {formatPercent(customOutcome.projectedPercentage)}
                  </strong>
                  <span
                    className={`custom-delta-tag ${
                      customOutcome.diff >= 0 ? 'text-safe' : 'text-danger'
                    }`}
                  >
                    {formatSignedPoints(customOutcome.diff)}
                  </span>
                </div>
                <span className="custom-result-ratio">
                  {data.attended + customAttend} / {data.held + customUpcoming} classes
                </span>
              </div>

              <StatusIndicator
                status={customOutcome.status}
                size="md"
              />
            </div>
          )}
        </div>
      )}
    </section>
  )
}
