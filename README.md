# Visual color-difference boundary demo

The full project is a private, end-to-end color ecosystem spanning spectral measurement, color data management, visual assessment, and practical color applications. The public dataset is entirely synthetic and illustrates a very small part of that ecosystem. The demo estimates the gray-scale grade 4 / 3–4 boundary for one simulated observer along the lightness-increase (+L*) direction. The base color, responses and IDs are synthetic. The repository contains no lab measurements, participant data or customer data.

## Run

Use Node.js 18 or later. No packages are required.

~~~sh
node demo.mjs
~~~

The script regenerates `synthetic_trials.csv` and prints the estimated boundary and a 95% percentile bootstrap interval.

## Method

- Keep C* and hue fixed. Simulate 192 independent responses across eight positive lightness steps with an equal number of trials for the two A/B assignments.
- Set `y=1` when the simulated observer selects the gray-scale pair with the larger difference (grade 3–4), irrespective of whether it appears at A or B.
- Fit a binomial logistic model to `y` using log(ΔL*) as the predictor. The estimated boundary is the ΔL* where the fitted probability reaches 50%.
- Resample responses within each step and A/B assignment to quantify uncertainty for this simulated observer.

The planted boundary is ΔL* = 2.600. This demonstration covers the single-observer threshold estimator. The full project's spectral processing, CIEDE2000 baseline and lab validation are future work.

## Example result

The seeded run estimates a boundary of 2.457 ΔL*, with a 95% bootstrap interval of [2.272, 2.668].
