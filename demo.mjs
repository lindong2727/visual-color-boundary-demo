import { writeFileSync } from 'node:fs'

const logistic = z => 1 / (1 + Math.exp(-z))

function randomStream(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0
    return seed / 2 ** 32
  }
}

const random = randomStream(421)
const trueBoundary = 2.6
const trialGroups = []
for (const step of [1.2, 1.6, 2.0, 2.4, 2.8, 3.3, 4.0, 4.8]) {
  for (const largerSide of ['A', 'B']) {
    const probability = logistic(4 * Math.log(step / trueBoundary))
    trialGroups.push(Array.from({ length: 12 }, () => {
      const y = Number(random() < probability)
      const choice = y ? largerSide : largerSide === 'A' ? 'B' : 'A'
      return { step, largerSide, choice, y }
    }))
  }
}

function fitBoundary(trials) {
  let intercept = 0
  let slope = 1
  for (let iteration = 0; iteration < 60; iteration++) {
    let score0 = 0, score1 = 0, info00 = 0, info01 = 0, info11 = 0
    for (const { step, y } of trials) {
      const x = Math.log(step)
      const probability = logistic(intercept + slope * x)
      const weight = probability * (1 - probability)
      score0 += y - probability
      score1 += (y - probability) * x
      info00 += weight
      info01 += weight * x
      info11 += weight * x * x
    }
    const determinant = info00 * info11 - info01 * info01
    if (determinant < 1e-10) throw new Error('Logistic fit is singular')
    const delta0 = (info11 * score0 - info01 * score1) / determinant
    const delta1 = (info00 * score1 - info01 * score0) / determinant
    intercept += delta0
    slope += delta1
    if (Math.max(Math.abs(delta0), Math.abs(delta1)) < 1e-9) {
      if (slope <= 0) throw new Error('Expected an increasing response curve')
      return Math.exp(-intercept / slope)
    }
  }
  throw new Error('Logistic fit did not converge')
}

const trials = trialGroups.flat()
const estimate = fitBoundary(trials)
const bootstrapRandom = randomStream(113)
const bootstrap = Array.from({ length: 1000 }, () => {
  const resample = trialGroups.flatMap(group =>
    group.map(() => group[Math.floor(bootstrapRandom() * group.length)]))
  return fitBoundary(resample)
}).sort((first, second) => first - second)

const quantile = fraction => bootstrap[Math.floor(fraction * (bootstrap.length - 1))]
const low = quantile(0.025)
const high = quantile(0.975)
if (low > trueBoundary || high < trueBoundary) {
  throw new Error('Synthetic demonstration failed to recover the planted boundary')
}

const header = 'observer_id,trial_id,direction,base_L,base_C,base_h,sample_L,step_L,grade_A,grade_B,choice,y'
const rows = trials.map(({ step, largerSide, choice, y }, index) => {
  const grades = largerSide === 'A' ? ['3-4', '4'] : ['4', '3-4']
  return ['SIM01', index + 1, '+L', '62.00', '24.00', '110.00',
    (62 + step).toFixed(2), step.toFixed(2), ...grades, choice, y].join(',')
})
writeFileSync(new URL('./synthetic_trials.csv', import.meta.url), [header, ...rows].join('\n') + '\n')

console.log('Source: synthetic trials only')
console.log('Trials: ' + trials.length)
console.log('Planted boundary (delta L*): ' + trueBoundary.toFixed(3))
console.log('Estimated boundary (delta L*): ' + estimate.toFixed(3))
console.log('95% bootstrap interval: [' + low.toFixed(3) + ', ' + high.toFixed(3) + ']')

