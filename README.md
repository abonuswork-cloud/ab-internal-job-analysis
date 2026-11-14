# Internal AB Resume Matchmaker

Internal facing for me to use. let's see what POCs you can come up with to help augment my job search, fine tune, and create skills that can be repeatable for each resume and each job listing I go for. 

Reverse-ATS & Semantic Gap Matcher
The Problem: General LLMs often rewrite resumes into generic buzzwords, or fail to highlight the exact taxonomy an enterprise ATS parser (Workday, Greenhouse, Lever) is scoring for.
The App: An internal workspace tool built specifically for your job hunt:
Upload your master resume data (or switch between your 3 variants: SF Product, Cyber Product, and General Product).
Paste in a target Job Description.
Gap Analysis Engine: Identifies exact missing keywords, hard skills (e.g., gRPC vs REST, NIST 800-53 vs SOC 2), and leadership competencies.
Surgical Bullet Tailoring: Generates suggested bullet refinements grounded strictly in your real background, outputting copy-pasteable ATS-optimized text without hallucinating experience.
Application Log: Stores the exact JD, tailored bullets, and date applied so you never walk into a screen unprepared.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ab-internal-job-analysis.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/04c0cbd2-4607-4a3e-8d18-c6ae814532a8).

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
