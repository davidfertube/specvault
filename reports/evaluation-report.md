# Evaluation Report: Claude Opus 4.5 Baseline vs RAG System

**Generated:** 2026-01-30T21:58:04.274Z
**Total Queries:** 30
**Verdict:** ❌ FAIL (56.7% pass rate)

## Executive Summary

| Metric | Baseline | RAG | Improvement |
|--------|----------|-----|-------------|
| Overall Accuracy | 0% | 56.7% | **+56.7%** |
| Hallucination Rate | 13.3% | 0% | **-13.3%** |
| Citation Accuracy | N/A | 100% | - |
| Avg Latency | 12ms | 29523ms | 29511ms |
| P95 Latency | - | 60521ms | ⚠️ >5s |

## Category Breakdown

| Category | Description | Baseline | RAG | Winner |
|----------|-------------|----------|-----|--------|
| A | Direct Lookup | 0% | 55.6% | RAG ✅ |
| B | Code Interpretation | 0% | 62.5% | RAG ✅ |
| C | Comparison | 0% | 25% | RAG ✅ |
| D | Complex/Multi-Part | 0% | 60% | RAG ✅ |
| E | Hallucination Detection | 0% | 75% | RAG ✅ |

## Hallucination Detection (Category E)

| Metric | Baseline | RAG |
|--------|----------|-----|
| Correct Refusals | 0/4 | 4/4 |
| Refusal Rate | 0% | 100% |

## Citation Quality (RAG Only)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Citation Accuracy | 100% | 100% | ✅ |
| Valid Page Numbers | 100% | 100% | ✅ |
| Char Offsets (PDF Highlighting) | 100% | 100% | ✅ |

## Comparison Breakdown

| Outcome | Count | Percentage |
|---------|-------|------------|
| RAG Improvements (Baseline wrong, RAG correct) | 17 | 57% |
| RAG Regressions (Baseline correct, RAG wrong) | 0 | 0% |
| Both Correct | 0 | 0% |
| Both Wrong | 13 | 43% |

## Detailed Results

<details>
<summary>Click to expand detailed results for each query</summary>

### A790-T1: What is the minimum yield strength of S32205 duplex stainless steel pipe per ASTM A790?

**Category:** A (lookup) | **Difficulty:** easy

**Baseline:** ❌ (348ms)
**RAG:** ✅ (40280ms)
**Comparison:** 📈 RAG Improvement

**Baseline Response:**
```

```

**RAG Response:**
```
I cannot answer this question because it's not in the uploaded documents. Please upload relevant specifications.

**Reasoning:** The provided context only includes ASTM A789 (duplex stainless steel tubing) specifications [1][2][3][4][5]. The question asks about ASTM A790 (pipe), which is a different...
```

**Citations:**
- [1] ASTM A789 Seamless & Welded Duplex Stainless Steel Tubing 2013.pdf (Page 4)
- [2] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [3] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [4] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [5] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)

---

### A790-T2: What is the maximum carbon content for S32750 super duplex per A790?

**Category:** A (lookup) | **Difficulty:** easy

**Baseline:** ❌ (0ms)
**RAG:** ✅ (2327ms)
**Comparison:** 📈 RAG Improvement

**Baseline Response:**
```

```

**RAG Response:**
```
**Answer:** The maximum carbon content for S32750 super duplex is not specified in the provided context for A790.

**Details:** The provided context for A790 does not contain information on S32750 super duplex. The UNS designation S32750 is mentioned in the context for A789, but not in the context f...
```

**Citations:**
- [1] 877794297-A312-A312M-25.pdf (Page 7)
- [2] 877794297-A312-A312M-25.pdf (Page 7)
- [3] 877794297-A312-A312M-25.pdf (Page 7)
- [4] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 2)
- [5] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 2)

---

### A790-T3: What is the heat treatment temperature range for S31803?

**Category:** A (lookup) | **Difficulty:** easy

**Baseline:** ❌ (0ms)
**RAG:** ❌ (38721ms)
**Comparison:** ❌ Both Wrong

**Baseline Response:**
```

```

**RAG Response:**
```
I cannot answer this question because it's not in the uploaded documents. Please upload relevant specifications.

**Sources:**
[1] ASTM-A790-Seamless-&-Welded-Duplex-Stainless-Steel-Pipe-2014.pdf, Page 9  
[2] ASTM-A872-Centrifugally-Cast-Duplex-Stainless-Steel-Pipe-2014.pdf, Page 2  
[3] 877794297-...
```

**Citations:**
- [1] ASTM A790 Seamless & Welded Duplex Stainless Steel Pipe 2014.pdf (Page 9)
- [2] ASTM A872 Centrifugally Cast Duplex Stainless Steel Pipe 2014.pdf (Page 2)
- [3] 877794297-A312-A312M-25.pdf (Page 8)
- [4] 877794297-A312-A312M-25.pdf (Page 8)
- [5] 877794297-A312-A312M-25.pdf (Page 8)

---

### A790-T4: What is the maximum hardness for S32205 duplex pipe?

**Category:** A (lookup) | **Difficulty:** easy

**Baseline:** ❌ (0ms)
**RAG:** ❌ (9511ms)
**Comparison:** ❌ Both Wrong

**Baseline Response:**
```

```

**RAG Response:**
```
**Answer:** The maximum hardness for S32205 duplex pipe is 30 HRC [1].

**Details:** This value is specified in Table 4 of ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf [1]. The corresponding tensile strength requirement is 95 ksi (655 MPa) minimum, and the yield strength re...
```

**Citations:**
- [1] ASTM A790 Seamless & Welded Duplex Stainless Steel Pipe 2014.pdf (Page 4)
- [2] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [3] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [4] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [5] 877794297-A312-A312M-25.pdf (Page 7)

---

### A790-T5: What is the minimum elongation requirement for S32750?

**Category:** A (lookup) | **Difficulty:** easy

**Baseline:** ❌ (0ms)
**RAG:** ✅ (42832ms)
**Comparison:** 📈 RAG Improvement

**Baseline Response:**
```

```

**RAG Response:**
```
**Answer:** The minimum elongation requirement for S32750 (UNS S32750) is **15%** [1][5].  

**Details:**  
- In **ASTM A789** (duplex stainless steel tubing), S32750 has a minimum elongation of **15%** as specified in Table 4 [1].  
- In **ASTM A790** (duplex stainless steel pipe), S32750 (designat...
```

**Citations:**
- [1] ASTM A789 Seamless & Welded Duplex Stainless Steel Tubing 2013.pdf (Page 4)
- [2] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [3] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [4] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [5] 897102004-ASTM-A790-A790M-24.pdf (Page 5)

---

### A790-T6: What ASTM standards are referenced by A790?

**Category:** B (list) | **Difficulty:** medium

**Baseline:** ❌ (0ms)
**RAG:** ❌ (31649ms)
**Comparison:** ❌ Both Wrong

**Baseline Response:**
```

```

**RAG Response:**
```
**Answer:** The provided documents do not list any ASTM standards referenced by ASTM A790/A790M-24. The only standard referenced in the context is ANSI B36.19 for pipe dimensions [1].  

**Details:**  
- Section 1.3 of ASTM A790/A790M-24 references ANSI B36.19 for pipe dimensions but does not cite a...
```

**Citations:**
- [1] 897102004-ASTM-A790-A790M-24.pdf (Page 1)
- [2] 897102004-ASTM-A790-A790M-24.pdf (Page 1)
- [3] 897102004-ASTM-A790-A790M-24.pdf (Page 1)
- [4] 897102004-ASTM-A790-A790M-24.pdf (Page 8)
- [5] 897102004-ASTM-A790-A790M-24.pdf (Page 8)

---

### A790-T7: What quenching methods are permitted after solution annealing per A790?

**Category:** B (lookup) | **Difficulty:** medium

**Baseline:** ❌ (0ms)
**RAG:** ✅ (34684ms)
**Comparison:** 📈 RAG Improvement

**Baseline Response:**
```

```

**RAG Response:**
```
**Answer:** The permitted quenching methods after solution annealing per ASTM A790 are water quenching or rapid cooling by other means. However, UNS S32950 is an exception and must be air cooled [2][3].

**Details:** Section 6.3.1 of ASTM A790 specifies that seamless pipe may be quenched in water or...
```

**Citations:**
- [1] ASTM A872 Centrifugally Cast Duplex Stainless Steel Pipe 2014.pdf (Page 2)
- [2] ASTM A790 Seamless & Welded Duplex Stainless Steel Pipe 2014.pdf (Page 3)
- [3] 897102004-ASTM-A790-A790M-24.pdf (Page 3)
- [4] 897102004-ASTM-A790-A790M-24.pdf (Page 3)
- [5] 897102004-ASTM-A790-A790M-24.pdf (Page 3)

---

### A790-T8: What is the scope of ASTM A790? What products does it cover?

**Category:** B (lookup) | **Difficulty:** easy

**Baseline:** ❌ (0ms)
**RAG:** ✅ (36068ms)
**Comparison:** 📈 RAG Improvement

**Baseline Response:**
```

```

**RAG Response:**
```
**Answer:**  
The scope of ASTM A790 covers **seamless and straight-seam welded ferritic/austenitic stainless steel pipe** intended for general corrosive service, with emphasis on resistance to stress corrosion cracking [1]. It specifically excludes information about tubing, which is addressed in AS...
```

**Citations:**
- [1] 897102004-ASTM-A790-A790M-24.pdf (Page 1)
- [2] 897102004-ASTM-A790-A790M-24.pdf (Page 1)
- [3] 897102004-ASTM-A790-A790M-24.pdf (Page 1)
- [4] ASTM A790 Seamless & Welded Duplex Stainless Steel Pipe 2014.pdf (Page 1)
- [5] 877794297-A312-A312M-25.pdf (Page 1)

---

### A790-T9: What supplementary requirements are available in A790?

**Category:** B (list) | **Difficulty:** medium

**Baseline:** ❌ (0ms)
**RAG:** ✅ (38929ms)
**Comparison:** 📈 RAG Improvement

**Baseline Response:**
```

```

**RAG Response:**
```
**Answer:** The supplementary requirements available in ASTM A790 include **S1 (Product Analysis)**, **S2 (Transverse Tension Tests)**, and **S3 (Flattening Test)** [1].  

**Details:**  
- **S1 (Product Analysis):**  
  - For pipe over NPS 5: One product analysis per ten lengths or fraction thereof...
```

**Citations:**
- [1] ASTM A790 Seamless & Welded Duplex Stainless Steel Pipe 2014.pdf (Page 8)
- [2] 877794297-A312-A312M-25.pdf (Page 11)
- [3] 877794297-A312-A312M-25.pdf (Page 11)
- [4] 877794297-A312-A312M-25.pdf (Page 11)
- [5] 877794297-A312-A312M-25.pdf (Page 11)

---

### A790-T10: What NDE methods are specified for A790 pipe?

**Category:** B (list) | **Difficulty:** medium

**Baseline:** ❌ (0ms)
**RAG:** ✅ (10351ms)
**Comparison:** 📈 RAG Improvement

**Baseline Response:**
```

```

**RAG Response:**
```
I cannot answer this question because it's not in the uploaded documents. Please upload relevant specifications.

The provided context only contains API Spec 5CRA documents [1][2][3][4][5], which relate to non-destructive examination (NDE) requirements for tubular products but do not contain any inf...
```

**Citations:**
- [1] API Spec 5CRA.pdf - April 2025.pdf (Page 38)
- [2] API Spec 5CRA - 2025.pdf (Page 38)
- [3] API Spec 5CRA.pdf - April 2025.pdf (Page 41)
- [4] API Spec 5CRA - 2025.pdf (Page 41)
- [5] API Spec 5CRA.pdf - April 2025.pdf (Page 108)

---

### A790-T11: Compare the tensile strength of S32205 vs S32750 per A790

**Category:** C (comparison) | **Difficulty:** medium

**Baseline:** ❌ (0ms)
**RAG:** ✅ (40060ms)
**Comparison:** 📈 RAG Improvement

**Baseline Response:**
```

```

**RAG Response:**
```
**Answer:** The tensile strength requirements for S32205 and S32750 per ASTM A790 are as follows:  
- **S32205 (2205):** Minimum tensile strength of 95 ksi [655 MPa] [5].  
- **S32750 (2507):** Minimum tensile strength of 116 ksi [800 MPa] [5].  

**Details:** These values are explicitly listed in *...
```

**Citations:**
- [1] ASTM A790 Seamless & Welded Duplex Stainless Steel Pipe 2014.pdf (Page 5)
- [2] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [3] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [4] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [5] 897102004-ASTM-A790-A790M-24.pdf (Page 5)

---

### A790-T12: What is the difference in nitrogen content between S32205 and S32750?

**Category:** C (comparison) | **Difficulty:** medium

**Baseline:** ❌ (0ms)
**RAG:** ❌ (2876ms)
**Comparison:** ❌ Both Wrong

**Baseline Response:**
```

```

**RAG Response:**
```
**Answer:** The nitrogen content for S32205 is 0.14–0.20 % [1], while for S32750 it is 0.24–0.32 % [2].

**Details:** This difference in nitrogen content is specified in the chemical requirements tables for each grade.

**Sources:**
[1] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2...
```

**Citations:**
- [1] 877794297-A312-A312M-25.pdf (Page 7)
- [2] 877794297-A312-A312M-25.pdf (Page 7)
- [3] 877794297-A312-A312M-25.pdf (Page 7)
- [4] 877794297-A312-A312M-25.pdf (Page 7)
- [5] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 2)

---

### A790-T13: Compare molybdenum content for S32205, S32750, and S32760

**Category:** C (comparison) | **Difficulty:** hard

**Baseline:** ❌ (0ms)
**RAG:** ❌ (52768ms)
**Comparison:** ❌ Both Wrong

**Baseline Response:**
```

```

**RAG Response:**
```
**Answer:** The molybdenum content for S32205, S32750, and S32760 is as follows:
- S32205: 3.0–3.5 [1]
- S32750: 2.9–3.9 [2]
- S32760: 3.0–4.0 [3]

**Details:** The molybdenum content is specified in Table 1 of ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf.

**Sources:**
[1]...
```

**Citations:**
- [1] API Spec 5CRA.pdf - April 2025.pdf (Page 93)
- [2] API Spec 5CRA - 2025.pdf (Page 93)
- [3] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 2)
- [4] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 2)
- [5] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 2)

---

### A790-T14: What are the complete mechanical and chemical requirements for S32205?

**Category:** D (lookup) | **Difficulty:** hard

**Baseline:** ❌ (0ms)
**RAG:** ❌ (3203ms)
**Comparison:** ❌ Both Wrong

**Baseline Response:**
```

```

**RAG Response:**
```

```

---

### A790-T15: What test specimens and procedures are required for A790 pipe?

**Category:** D (list) | **Difficulty:** hard

**Baseline:** ❌ (0ms)
**RAG:** ❌ (4055ms)
**Comparison:** ❌ Both Wrong

**Baseline Response:**
```

```

**RAG Response:**
```
I cannot answer this question because it's not in the uploaded documents. Please upload relevant specifications.

The provided ASTM A790 documents [1][2][3][4] contain only general standard information, copyright notices, and revision policies. No specific test specimen requirements or testing proce...
```

**Citations:**
- [1] ASTM A790 Seamless & Welded Duplex Stainless Steel Pipe 2014.pdf (Page 5)
- [2] 897102004-ASTM-A790-A790M-24.pdf (Page 10)
- [3] 897102004-ASTM-A790-A790M-24.pdf (Page 10)
- [4] 897102004-ASTM-A790-A790M-24.pdf (Page 10)
- [5] API Spec 5CRA - 2025.pdf (Page 28)

---

### A790-T16: What wall thickness tolerance applies to NPS 4 Schedule 40 A790 pipe?

**Category:** D (lookup) | **Difficulty:** hard

**Baseline:** ❌ (0ms)
**RAG:** ✅ (16311ms)
**Comparison:** 📈 RAG Improvement

**Baseline Response:**
```

```

**RAG Response:**
```
I cannot answer this question because it's not in the uploaded documents. Please upload relevant specifications.

The provided documents only contain information about ASTM A312 (austenitic stainless steel pipe) and ASTM A789 (duplex stainless steel tubing), but no information about ASTM A790 (duple...
```

**Citations:**
- [1] 877794297-A312-A312M-25.pdf (Page 8)
- [2] 877794297-A312-A312M-25.pdf (Page 8)
- [3] 877794297-A312-A312M-25.pdf (Page 8)
- [4] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 3)
- [5] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 3)

---

### A790-T17: What is the PREN formula for calculating pitting resistance of S32205?

**Category:** E (refusal) | **Difficulty:** hard

**Baseline:** ❌ (0ms)
**RAG:** ✅ (33638ms)
**Comparison:** 📈 RAG Improvement

**Baseline Response:**
```

```

**RAG Response:**
```
I cannot answer this question because it's not in the uploaded documents. Please upload relevant specifications.

The provided documents contain chemical composition data for S32205 (UNS S32205) in tables [1][2][3], but none explicitly define the PREN (Pitting Resistance Equivalent Number) formula. ...
```

**Citations:**
- [1] 877794297-A312-A312M-25.pdf (Page 5)
- [2] 877794297-A312-A312M-25.pdf (Page 4)
- [3] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [4] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [5] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)

---

### A790-T18: What is the price per foot of A790 S32205 pipe?

**Category:** E (refusal) | **Difficulty:** easy

**Baseline:** ❌ (0ms)
**RAG:** ✅ (24159ms)
**Comparison:** 📈 RAG Improvement

**Baseline Response:**
```

```

**RAG Response:**
```
I cannot answer this question because it's not in the uploaded documents. Please upload relevant specifications.

**Sources:**
[1] 897102004-ASTM-A790-A790M-24.pdf, Page 8  
[2] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf, Page 4
```

**Citations:**
- [1] 897102004-ASTM-A790-A790M-24.pdf (Page 8)
- [2] 897102004-ASTM-A790-A790M-24.pdf (Page 8)
- [3] 897102004-ASTM-A790-A790M-24.pdf (Page 8)
- [4] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [5] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)

---

### A790-T19: What is the corrosion rate of S32750 in seawater at 25C?

**Category:** E (refusal) | **Difficulty:** medium

**Baseline:** ❌ (0ms)
**RAG:** ✅ (62659ms)
**Comparison:** 📈 RAG Improvement

**Baseline Response:**
```

```

**RAG Response:**
```
I cannot answer this question because it's not in the uploaded documents. Please upload relevant specifications.

**Sources:**
[1] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf
[2] ASTM A790 Seamless & Welded Duplex Stainless Steel Pipe 2014.pdf
[3] 877794297-A312-A312M-25.p...
```

**Citations:**
- [1] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 2)
- [2] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 2)
- [3] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 2)
- [4] ASTM A790 Seamless & Welded Duplex Stainless Steel Pipe 2014.pdf (Page 4)
- [5] 877794297-A312-A312M-25.pdf (Page 12)

---

### A790-T20: What welding procedures are required for A790 pipe repair?

**Category:** D (lookup) | **Difficulty:** medium

**Baseline:** ❌ (0ms)
**RAG:** ✅ (9422ms)
**Comparison:** 📈 RAG Improvement

**Baseline Response:**
```

```

**RAG Response:**
```
**Answer:** The welding procedures for repairing ASTM A790 pipe require the following:  
- Use gas tungsten-arc welding (GTAW) with compatible filler metal classified under AWS A5.9, as specified in Table 4 [1].  
- Repairs must not exceed 20% of the weld seam length [1].  
- For NPS 6 or larger pip...
```

**Citations:**
- [1] 897102004-ASTM-A790-A790M-24.pdf (Page 7)
- [2] 897102004-ASTM-A790-A790M-24.pdf (Page 7)
- [3] 897102004-ASTM-A790-A790M-24.pdf (Page 7)
- [4] 877794297-A312-A312M-25.pdf (Page 10)
- [5] 877794297-A312-A312M-25.pdf (Page 10)

---

### CONF-001: What is the yield strength of S32205 duplex tubing per ASTM A789?

**Category:** A (lookup) | **Difficulty:** medium

**Baseline:** ❌ (0ms)
**RAG:** ✅ (39652ms)
**Comparison:** 📈 RAG Improvement

**Baseline Response:**
```

```

**RAG Response:**
```
**Answer:** The minimum yield strength for S32205 duplex stainless steel tubing per ASTM A789 is **70 ksi [485 MPa]** [5].  

**Details:** This value is specified in **Table 4** of ASTM A789 (2013 edition). The corresponding tensile strength requirement for S32205 is **95 ksi [655 MPa]** minimum [5]...
```

**Citations:**
- [1] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [2] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [3] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [4] ASTM A789 Seamless & Welded Duplex Stainless Steel Tubing 2013.pdf (Page 4)
- [5] ASTM A789 Seamless & Welded Duplex Stainless Steel Tubing 2013.pdf (Page 4)

---

### CONF-002: What is the yield strength of S32205 duplex pipe per ASTM A790?

**Category:** A (lookup) | **Difficulty:** medium

**Baseline:** ❌ (0ms)
**RAG:** ❌ (38768ms)
**Comparison:** ❌ Both Wrong

**Baseline Response:**
```

```

**RAG Response:**
```
I cannot answer this question because it's not in the uploaded documents. Please upload relevant specifications.

**Reasoning:** The provided context only includes documents related to ASTM A789 (duplex stainless steel tubing), not ASTM A790 (duplex stainless steel pipe). The question specifically a...
```

**Citations:**
- [1] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [2] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [3] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [4] ASTM A789 Seamless & Welded Duplex Stainless Steel Tubing 2013.pdf (Page 4)
- [5] ASTM A789 Seamless & Welded Duplex Stainless Steel Tubing 2013.pdf (Page 4)

---

### CONF-003: Compare the yield strength of S32205 in A789 tubing vs A790 pipe specifications

**Category:** C (comparison) | **Difficulty:** hard

**Baseline:** ❌ (0ms)
**RAG:** ❌ (35228ms)
**Comparison:** ❌ Both Wrong

**Baseline Response:**
```

```

**RAG Response:**
```
I cannot answer this question because it's not in the uploaded documents. The provided context does not contain:  
1. Mechanical property data for S32205 in ASTM A790 (only references to "Table 3" without values) [1][2][3]  
2. Any information about ASTM A789 tubing specifications (no A789 documents...
```

**Citations:**
- [1] 897102004-ASTM-A790-A790M-24.pdf (Page 3)
- [2] 897102004-ASTM-A790-A790M-24.pdf (Page 3)
- [3] 897102004-ASTM-A790-A790M-24.pdf (Page 3)
- [4] ASTM A790 Seamless & Welded Duplex Stainless Steel Pipe 2014.pdf (Page 5)
- [5] 877794297-A312-A312M-25.pdf (Page 2)

---

### CONF-004: What supplementary requirements are available in A789?

**Category:** B (list) | **Difficulty:** medium

**Baseline:** ❌ (0ms)
**RAG:** ❌ (60521ms)
**Comparison:** ❌ Both Wrong

**Baseline Response:**
```

```

**RAG Response:**
```

```

---

### CONF-005: Does ASTM A789 include repair welding procedures?

**Category:** E (refusal) | **Difficulty:** hard

**Baseline:** ❌ (0ms)
**RAG:** ❌ (16485ms)
**Comparison:** ❌ Both Wrong

**Baseline Response:**
```

```

**RAG Response:**
```
I cannot answer this question because it's not in the uploaded documents. Please upload relevant specifications.

The provided pages from ASTM A789 only contain Scope, Referenced Documents, and Ordering Information sections [1][2][3][4]. There is no mention of repair welding procedures in the upload...
```

**Citations:**
- [1] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 1)
- [2] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 1)
- [3] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 1)
- [4] ASTM A789 Seamless & Welded Duplex Stainless Steel Tubing 2013.pdf (Page 1)
- [5] ASTM A790 Seamless & Welded Duplex Stainless Steel Pipe 2014.pdf (Page 7)

---

### CONF-006: What product form does A789 cover?

**Category:** B (lookup) | **Difficulty:** easy

**Baseline:** ❌ (0ms)
**RAG:** ✅ (29662ms)
**Comparison:** 📈 RAG Improvement

**Baseline Response:**
```

```

**RAG Response:**
```
**Answer:** ASTM A789 covers **seamless and welded ferritic/austenitic stainless steel tubing** for general service [4].  

**Details:** The specification explicitly states its scope as "Seamless and Welded Ferritic/Austenitic Stainless Steel Tubing for General Service" in its title and Section 1.1,...
```

**Citations:**
- [1] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 3)
- [2] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 3)
- [3] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 3)
- [4] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 1)
- [5] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 1)

---

### CONF-007: What ASTM standards are referenced by A789?

**Category:** B (list) | **Difficulty:** hard

**Baseline:** ❌ (0ms)
**RAG:** ❌ (32780ms)
**Comparison:** ❌ Both Wrong

**Baseline Response:**
```

```

**RAG Response:**
```
**Answer:** The referenced ASTM standards for ASTM A789 are listed on the ASTM website, as specified in the document. Specific standards are not enumerated in the provided context [1].  

**Details:** The document states: "For referenced ASTM standards, visit the ASTM website, www.astm.org, or conta...
```

**Citations:**
- [1] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 1)
- [2] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 1)
- [3] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 1)
- [4] ASTM A789 Seamless & Welded Duplex Stainless Steel Tubing 2013.pdf (Page 1)
- [5] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 3)

---

### CONF-008: What is the tensile strength of S32003 per A789?

**Category:** A (lookup) | **Difficulty:** hard

**Baseline:** ❌ (0ms)
**RAG:** ✅ (40653ms)
**Comparison:** 📈 RAG Improvement

**Baseline Response:**
```

```

**RAG Response:**
```
**Answer:** The tensile strength of S32003 per ASTM A789 is specified as 100 ksi [690 MPa] minimum, as noted in the historical revision prior to A789/A789M–04 [4]. However, the current tensile strength value for S32003 is not explicitly listed in the provided documents for the latest specification v...
```

**Citations:**
- [1] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [2] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [3] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [4] ASTM A789 Seamless & Welded Duplex Stainless Steel Tubing 2013.pdf (Page 4)
- [5] ASTM A789 Seamless & Welded Duplex Stainless Steel Tubing 2013.pdf (Page 4)

---

### CONF-009: What dimensional tolerances apply to A789 tubing?

**Category:** D (lookup) | **Difficulty:** medium

**Baseline:** ❌ (0ms)
**RAG:** ✅ (27649ms)
**Comparison:** 📈 RAG Improvement

**Baseline Response:**
```

```

**RAG Response:**
```
I cannot answer this question because it's not in the uploaded documents. Please upload relevant specifications.

The provided excerpts from ASTM A789 only discuss mechanical properties (tensile/yield strength, elongation) and general tubing size categories (outside diameter ranges), but no dimensio...
```

**Citations:**
- [1] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 3)
- [2] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 3)
- [3] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 3)
- [4] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)
- [5] ASTM A789 Seamless & Welded Duplex Tubing For General Service 2014.pdf (Page 4)

---

### CONF-010: What is the yield strength of S32304 lean duplex per A789 for OD less than or equal to 1 inch?

**Category:** A (lookup) | **Difficulty:** hard

**Baseline:** ❌ (0ms)
**RAG:** ❌ (29798ms)
**Comparison:** ❌ Both Wrong

**Baseline Response:**
```

```

**RAG Response:**
```
I cannot answer this question because it's not in the uploaded documents. Please upload relevant specifications.

**Details:** None of the provided documents contain mechanical property data for S32304 lean duplex stainless steel tubing (UNS S32304) under ASTM A789. The available documents reference...
```

**Citations:**
- [1] ASTM A872 Centrifugally Cast Duplex Stainless Steel Pipe 2014.pdf (Page 3)
- [2] API Spec 5CRA - 2025.pdf (Page 64)
- [3] API Spec 5CRA.pdf - April 2025.pdf (Page 64)
- [4] API Spec 5CRA - 2025.pdf (Page 51)
- [5] API Spec 5CRA.pdf - April 2025.pdf (Page 51)

---

</details>

## Recommendations

- ⚠️ RAG accuracy below 90% threshold - review failed queries and improve retrieval
- ⚠️ P95 latency exceeds 5 seconds - optimize retrieval or LLM generation

---

*Report generated by Spec Agents Evaluation Framework*