import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  calculateAfterAbsence,
  calculateAfterAttendance,
  calculateAttendance,
  calculateClassesNeeded,
  calculateDailyImpact,
  calculateExpectedFinal,
  calculateSafeAbsences,
  calculateSemesterProjection,
  calculateTargetReachability,
  getAttendanceStatus,
} from './engine'

type Subject = {
  id: string
  name: string
  attended: number
  held: number
}

type AttendanceState = {
  attended: number
  held: number
  target: number
  remainingClasses: number
  expectedRate: number
  classesToday: number
  classesThisWeek: number
  subjects: Subject[]
}

const STORAGE_KEY = 'attendance-intelligence-state'

const defaultSubjects: Subject[] = [
  { id: 'maths', name: 'Mathematics', attended: 26, held: 32 },
  { id: 'physics', name: 'Physics', attended: 18, held: 24 },
  { id: 'chemistry', name: 'Chemistry', attended: 20, held: 26 },
  { id: 'english', name: 'English', attended: 18, held: 20 },
]

const emptyState: AttendanceState = {
  attended: 0,
  held: 0,
  target: 75,
  remainingClasses: 24,
  expectedRate: 85,
  classesToday: 4,
  classesThisWeek: 6,
  subjects: [],
}

const demoState: AttendanceState = {
  attended: 84,
  held: 100,
  target: 75,
  remainingClasses: 28,
  expectedRate: 86,
  classesToday: 4,
  classesThisWeek: 6,
  subjects: defaultSubjects,
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0.00%'
  return `${value.toFixed(2)}%`
}

function formatSigned(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)} pts`
}

function App() {
  const [showLanding, setShowLanding] = useState<boolean>(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return !stored
  })

  const [data, setData] = useState<AttendanceState>(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return emptyState

    try {
      return { ...emptyState, ...JSON.parse(stored) }
    } catch {
      return emptyState
    }
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const updateField = <K extends keyof AttendanceState>(
    key: K,
    value: AttendanceState[K],
  ) => {
    setData((previous) => ({ ...previous, [key]: value }))
  }

  const currentPercentage = useMemo(
    () => calculateAttendance(data.attended, data.held),
    [data.attended, data.held],
  )

  const status = useMemo(
    () => getAttendanceStatus(currentPercentage, data.target),
    [currentPercentage, data.target],
  )

  const safeAbsences = useMemo(
    () => calculateSafeAbsences(data.attended, data.held, data.target),
    [data.attended, data.held, data.target],
  )

  const classesNeeded = useMemo(
    () => calculateClassesNeeded(data.attended, data.held, data.target),
    [data.attended, data.held, data.target],
  )

  const targetReachability = useMemo(
    () => calculateTargetReachability(
      data.attended,
      data.held,
      data.target,
      data.remainingClasses,
    ),
    [data.attended, data.held, data.target, data.remainingClasses],
  )

  const nextAttend = useMemo(
    () => calculateAfterAttendance(data.attended, data.held, 1),
    [data.attended, data.held],
  )

  const nextMiss = useMemo(
    () => calculateAfterAbsence(data.attended, data.held, 1),
    [data.attended, data.held],
  )

  const [comparisonN, setComparisonN] = useState(5)

  const nextFiveAttend = useMemo(
    () => calculateAfterAttendance(data.attended, data.held, comparisonN),
    [comparisonN, data.attended, data.held],
  )

  const nextFiveMiss = useMemo(
    () => calculateAfterAbsence(data.attended, data.held, comparisonN),
    [comparisonN, data.attended, data.held],
  )

  const semesterProjection = useMemo(
    () => calculateSemesterProjection(
      data.attended,
      data.held,
      data.remainingClasses,
      data.expectedRate,
    ),
    [data.attended, data.held, data.expectedRate, data.remainingClasses],
  )

  const impact = useMemo(
    () => calculateDailyImpact(data.attended, data.held),
    [data.attended, data.held],
  )

  const subjects = useMemo(
    () =>
      [...(data.subjects.length ? data.subjects : defaultSubjects)].sort((a, b) => {
        const diffA = Math.abs(calculateAttendance(a.attended, a.held) - data.target)
        const diffB = Math.abs(calculateAttendance(b.attended, b.held) - data.target)
        return diffA - diffB
      }),
    [data.subjects, data.target],
  )

  const dayScenarios = useMemo(() => {
    const total = Math.max(0, data.classesToday)

    return Array.from({ length: total + 1 }, (_, absent) => {
      const attendedToday = total - absent
      const projected = calculateAttendance(
        data.attended + attendedToday,
        data.held + total,
      )
      const change = projected - currentPercentage

      return {
        label: `${attendedToday}/${total}`,
        attendedToday,
        absentToday: absent,
        projected,
        change,
      }
    })
  }, [currentPercentage, data.attended, data.classesToday, data.held])

  const weekScenarios = useMemo(
    () => ({
      best: calculateExpectedFinal(data.attended, data.held, data.classesThisWeek, 100),
      expected: calculateExpectedFinal(
        data.attended,
        data.held,
        data.classesThisWeek,
        data.expectedRate,
      ),
      worst: calculateExpectedFinal(data.attended, data.held, data.classesThisWeek, 0),
    }),
    [data.attended, data.classesThisWeek, data.expectedRate, data.held],
  )

  const summaryCards = [
    {
      label: 'Current attendance',
      value: formatPercent(currentPercentage),
      helper: `${data.attended} attended / ${data.held} held`,
    },
    {
      label: 'Status',
      value: status,
      helper: `${data.target}% target`,
    },
    {
      label: 'Safe absence buffer',
      value: `${safeAbsences} classes`,
      helper: `Last safe absence: ${safeAbsences}`,
    },
    {
      label: 'Impact of one class',
      value: `${impact.impactRatio.toFixed(2)}x`,
      helper: `Absence vs attendance`,
    },
  ]

  const handleLoadDemo = () => {
    setData(demoState)
    setShowLanding(false)
  }

  const handleReset = () => {
    setData(emptyState)
    setShowLanding(true)
  }

  if (showLanding) {
    return (
      <main className="shell landing-shell">
        <div className="landing-card">
          <div className="eyebrow">Student-only attendance intelligence</div>
          <h1>
            YOUR ATTENDANCE.
            <span>MADE UNDERSTANDABLE.</span>
          </h1>
          <p className="subheading">
            Know where you stand, understand the impact of your next class, and plan the
            rest of your semester.
          </p>

          <div className="cta-row">
            <button type="button" className="primary-button" onClick={() => setShowLanding(false)}>
              CHECK MY ATTENDANCE
            </button>
            <button type="button" className="secondary-button" onClick={handleLoadDemo}>
              TRY DEMO
            </button>
          </div>

          <div className="privacy-note">
            Your attendance calculations can run locally in your browser.
          </div>

          <div className="landing-options">
            <div className="option-card">
              <div className="option-pill">Overall</div>
              <div>Classes held / classes attended</div>
            </div>
            <div className="option-card">
              <div className="option-pill">Subject-wise</div>
              <div>Track risk by subject and recovery requirement</div>
            </div>
            <div className="option-card">
              <div className="option-pill">Daily</div>
              <div>See what today does to your semester</div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">A</div>
          <div>
            <div className="brand-name">ATTENDANCE</div>
            <div className="brand-caption">Planning calculations only</div>
          </div>
        </div>
        <nav className="nav" aria-label="Main navigation">
          <button type="button" className="nav-item active">HOME</button>
          <button type="button" className="nav-item">SIMULATE</button>
          <button type="button" className="nav-item">SUBJECTS</button>
          <button type="button" className="nav-item">FORECAST</button>
        </nav>
      </header>

      <section className="hero-panel card">
        <div className="hero-main">
          <div className="attendance-ring" style={{ ['--percent' as string]: `${currentPercentage}%` }}>
            <div className="ring-center">
              <div className="ring-label">CURRENT</div>
              <div className="ring-value">{formatPercent(currentPercentage)}</div>
            </div>
          </div>

          <div className="hero-content">
            <div className="entry-header">
              <h2>CURRENT ATTENDANCE</h2>
              <button type="button" className="ghost-button" onClick={handleReset}>
                RESET
              </button>
            </div>

            <div className="form-grid">
              <label>
                Classes attended
                <input
                  type="number"
                  min="0"
                  value={data.attended}
                  onChange={(event) => updateField('attended', Number(event.target.value) || 0)}
                />
              </label>
              <label>
                Classes held
                <input
                  type="number"
                  min="0"
                  value={data.held}
                  onChange={(event) => updateField('held', Number(event.target.value) || 0)}
                />
              </label>
              <label>
                Target
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={data.target}
                  onChange={(event) => updateField('target', Number(event.target.value) || 0)}
                />
              </label>
              <label>
                Remaining classes
                <input
                  type="number"
                  min="0"
                  value={data.remainingClasses}
                  onChange={(event) =>
                    updateField('remainingClasses', Number(event.target.value) || 0)
                  }
                />
              </label>
            </div>
          </div>
        </div>

        <div className="hero-meta">
          <div className="meta-box">
            <span className="meta-label">ATTENDED</span>
            <strong>{data.attended}</strong>
          </div>
          <div className="meta-box">
            <span className="meta-label">HELD</span>
            <strong>{data.held}</strong>
          </div>
          <div className="meta-box">
            <span className="meta-label">ABSENT</span>
            <strong>{Math.max(0, data.held - data.attended)}</strong>
          </div>
          <div className="meta-box status-box">
            <span className="meta-label">STATUS</span>
            <strong className={`status-pill ${status.toLowerCase().replace(/\s+/g, '-')}`}>
              {status}
            </strong>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className="mini-card card">
            <div className="metric-label">{card.label}</div>
            <div className="metric-value">{card.value}</div>
            <div className="metric-helper">{card.helper}</div>
          </article>
        ))}
      </section>

      <section className="card section-block">
        <div className="section-header">
          <div>
            <div className="eyebrow">Signature feature</div>
            <h2>WHAT HAPPENS NEXT?</h2>
          </div>
          <label className="range-control">
            <span>{comparisonN} classes</span>
            <input
              type="range"
              min="1"
              max="12"
              value={comparisonN}
              onChange={(event) => setComparisonN(Number(event.target.value))}
            />
          </label>
        </div>

        <div className="impact-grid">
          <div className="impact-card">
            <div className="impact-title">NEXT CLASS</div>
            <div className="impact-split">
              <div>
                <span>Attend</span>
                <strong>{formatPercent(nextAttend)}</strong>
                <small>{formatSigned(nextAttend - currentPercentage)}</small>
              </div>
              <div>
                <span>Miss</span>
                <strong>{formatPercent(nextMiss)}</strong>
                <small>{formatSigned(nextMiss - currentPercentage)}</small>
              </div>
            </div>
          </div>

          <div className="impact-card">
            <div className="impact-title">NEXT {comparisonN}</div>
            <div className="impact-split">
              <div>
                <span>Attend all</span>
                <strong>{formatPercent(nextFiveAttend)}</strong>
                <small>{formatSigned(nextFiveAttend - currentPercentage)}</small>
              </div>
              <div>
                <span>Miss all</span>
                <strong>{formatPercent(nextFiveMiss)}</strong>
                <small>{formatSigned(nextFiveMiss - currentPercentage)}</small>
              </div>
            </div>
          </div>

          <div className="impact-card">
            <div className="impact-title">THIS WEEK</div>
            <div className="impact-stack">
              <div>
                <span>Best</span>
                <strong>{formatPercent(weekScenarios.best)}</strong>
              </div>
              <div>
                <span>Expected</span>
                <strong>{formatPercent(weekScenarios.expected)}</strong>
              </div>
              <div>
                <span>Worst</span>
                <strong>{formatPercent(weekScenarios.worst)}</strong>
              </div>
            </div>
          </div>

          <div className="impact-card">
            <div className="impact-title">END OF SEMESTER</div>
            <div className="impact-stack">
              <div>
                <span>Best</span>
                <strong>{formatPercent(semesterProjection.best)}</strong>
              </div>
              <div>
                <span>Expected</span>
                <strong>{formatPercent(semesterProjection.expected)}</strong>
              </div>
              <div>
                <span>Worst</span>
                <strong>{formatPercent(semesterProjection.worst)}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="double-grid">
        <article className="card section-block">
          <div className="section-header compact">
            <div>
              <div className="eyebrow">Safety margin</div>
              <h2>ATTENDANCE BUFFER</h2>
            </div>
          </div>

          <div className="buffer-box">
            <div className="buffer-head">
              <span>{data.target}% target</span>
              <strong>{safeAbsences} classes</strong>
            </div>
            <div className="buffer-row">
              <span>Last safe absence</span>
              <strong>{safeAbsences}</strong>
            </div>
            <div className="buffer-row">
              <span>Next absence crosses target</span>
              <strong>{safeAbsences + 1}</strong>
            </div>
          </div>
        </article>

        <article className="card section-block">
          <div className="section-header compact">
            <div>
              <div className="eyebrow">Target Planner</div>
              <h2>CAN I STILL REACH {data.target}%?</h2>
            </div>
          </div>

          <div className="target-box">
            <div className="target-pill">
              {targetReachability.reachable ? 'TARGET STILL REACHABLE' : 'TARGET UNREACHABLE'}
            </div>
            <div className="detail-row">
              <span>Maximum possible</span>
              <strong>{formatPercent(targetReachability.maxPossible)}</strong>
            </div>
            <div className="detail-row">
              <span>Required to recover</span>
              <strong>
                {classesNeeded === null ? 'No path' : `${classesNeeded} consecutive classes`}
              </strong>
            </div>
          </div>
        </article>
      </section>

      <section className="double-grid">
        <article className="card section-block">
          <div className="section-header compact">
            <div>
              <div className="eyebrow">Today</div>
              <h2>DAY SIMULATOR</h2>
            </div>
            <label className="inline-number">
              <span>Classes today</span>
              <input
                type="number"
                min="0"
                value={data.classesToday}
                onChange={(event) =>
                  updateField('classesToday', Number(event.target.value) || 0)
                }
              />
            </label>
          </div>

          <div className="scenario-list">
            {dayScenarios.slice(0, Math.min(dayScenarios.length, 6)).map((scenario) => (
              <div key={scenario.label} className="scenario-row">
                <span>{scenario.label}</span>
                <strong>{formatPercent(scenario.projected)}</strong>
                <small>{formatSigned(scenario.change)}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="card section-block">
          <div className="section-header compact">
            <div>
              <div className="eyebrow">This week</div>
              <h2>WEEK SIMULATOR</h2>
            </div>
            <label className="inline-number">
              <span>Classes this week</span>
              <input
                type="number"
                min="0"
                value={data.classesThisWeek}
                onChange={(event) =>
                  updateField('classesThisWeek', Number(event.target.value) || 0)
                }
              />
            </label>
          </div>

          <div className="scenario-list">
            <div className="scenario-row">
              <span>Best case</span>
              <strong>{formatPercent(weekScenarios.best)}</strong>
              <small>Attend 100%</small>
            </div>
            <div className="scenario-row">
              <span>Expected</span>
              <strong>{formatPercent(weekScenarios.expected)}</strong>
              <small>{data.expectedRate}% attendance rate</small>
            </div>
            <div className="scenario-row">
              <span>Worst case</span>
              <strong>{formatPercent(weekScenarios.worst)}</strong>
              <small>Miss everything</small>
            </div>
          </div>
        </article>
      </section>

      <section className="card section-block">
        <div className="section-header">
          <div>
            <div className="eyebrow">Forecast</div>
            <h2>SEMESTER FORECAST</h2>
          </div>
          <label className="inline-number">
            <span>Expected rate</span>
            <input
              type="number"
              min="0"
              max="100"
              value={data.expectedRate}
              onChange={(event) =>
                updateField('expectedRate', Number(event.target.value) || 0)
              }
            />
          </label>
        </div>

        <div className="forecast-chart" aria-label="Attendance forecast chart">
          {[semesterProjection.current, semesterProjection.best, semesterProjection.expected, semesterProjection.worst, data.target].map(
            (value, index) => {
              const width = Math.max(14, (value / 100) * 100)
              const labels = ['CURRENT', 'BEST', 'EXPECTED', 'WORST', 'TARGET']

              return (
                <div key={labels[index]} className="forecast-bar" style={{ width: `${width}%` }}>
                  <span>{labels[index]}</span>
                  <strong>{formatPercent(value)}</strong>
                </div>
              )
            },
          )}
        </div>
      </section>

      <section className="card section-block">
        <div className="section-header compact">
          <div>
            <div className="eyebrow">Risk ranking</div>
            <h2>WHERE SHOULD I PAY ATTENTION?</h2>
          </div>
        </div>

        <div className="subject-list">
          {subjects.map((subject, index) => {
            const subjectPct = calculateAttendance(subject.attended, subject.held)
            const subjectGap = Math.abs(subjectPct - data.target)
            const safe = calculateSafeAbsences(subject.attended, subject.held, data.target)
            const needed = calculateClassesNeeded(subject.attended, subject.held, data.target)

            return (
              <div key={subject.id} className="subject-row">
                <div className="subject-rank">{index + 1}</div>
                <div className="subject-main">
                  <strong>{subject.name}</strong>
                  <small>
                    {subject.attended}/{subject.held} classes · {Math.max(0, subject.held - subject.attended)} absent
                  </small>
                </div>
                <div className="subject-metric">
                  <span>Attendance</span>
                  <strong>{formatPercent(subjectPct)}</strong>
                </div>
                <div className="subject-metric">
                  <span>Gap</span>
                  <strong>{subjectGap.toFixed(1)} pts</strong>
                </div>
                <div className="subject-metric">
                  <span>Safe miss</span>
                  <strong>{safe}</strong>
                </div>
                <div className="subject-metric">
                  <span>Needed</span>
                  <strong>{needed === null ? '∞' : needed}</strong>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}

export default App
