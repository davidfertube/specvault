/**
 * Synthetic Document Generator for Stress Testing
 *
 * Generates complex, realistic ASTM-style specification documents
 * for testing the RAG pipeline at scale.
 *
 * Document 1: Extreme Complexity (300 pages)
 * - 50+ nested tables
 * - Cross-references
 * - Formulas
 * - Mixed units
 *
 * Document 2: Edge Case Stress Test (300 pages)
 * - Tables with merged cells patterns
 * - Non-standard symbols
 * - Acronym-heavy sections
 * - External references
 */

// ============================================
// Chemical Elements Database
// ============================================

const CHEMICAL_ELEMENTS = {
  C: { name: 'Carbon', typical: { min: 0.01, max: 0.04 } },
  Mn: { name: 'Manganese', typical: { min: 0.5, max: 2.5 } },
  P: { name: 'Phosphorus', typical: { min: 0.01, max: 0.045 } },
  S: { name: 'Sulfur', typical: { min: 0.01, max: 0.035 } },
  Si: { name: 'Silicon', typical: { min: 0.5, max: 1.5 } },
  Ni: { name: 'Nickel', typical: { min: 3.0, max: 9.0 } },
  Cr: { name: 'Chromium', typical: { min: 18.0, max: 28.0 } },
  Mo: { name: 'Molybdenum', typical: { min: 1.0, max: 5.0 } },
  N: { name: 'Nitrogen', typical: { min: 0.05, max: 0.35 } },
  Cu: { name: 'Copper', typical: { min: 0.1, max: 3.0 } },
  W: { name: 'Tungsten', typical: { min: 0.5, max: 2.5 } },
  Co: { name: 'Cobalt', typical: { min: 0.1, max: 2.0 } },
  Ti: { name: 'Titanium', typical: { min: 0.01, max: 0.5 } },
  Nb: { name: 'Niobium', typical: { min: 0.01, max: 0.5 } },
  V: { name: 'Vanadium', typical: { min: 0.01, max: 0.3 } },
};

// ============================================
// Grade Generation
// ============================================

export interface SyntheticGrade {
  designation: string;
  unsNumber: string;
  chemicalComposition: Record<string, { min?: number; max: number }>;
  tensileStrength: { min: number; unit: string };
  yieldStrength: { min: number; unit: string };
  elongation: { min: number };
  hardness?: { max: number; scale: string };
  heatTreatment: { tempMin: number; tempMax: number; quench: string };
  pren?: number;
}

function generateRandomComposition(): Record<string, { min?: number; max: number }> {
  const composition: Record<string, { min?: number; max: number }> = {};

  for (const [symbol, data] of Object.entries(CHEMICAL_ELEMENTS)) {
    const includeElement = Math.random() > 0.3;
    if (includeElement) {
      const hasRange = Math.random() > 0.5;
      const max = data.typical.min + Math.random() * (data.typical.max - data.typical.min);

      if (hasRange) {
        const min = max * (0.6 + Math.random() * 0.3);
        composition[symbol] = { min: Number(min.toFixed(2)), max: Number(max.toFixed(2)) };
      } else {
        composition[symbol] = { max: Number(max.toFixed(3)) };
      }
    }
  }

  return composition;
}

function generateSyntheticGrade(index: number): SyntheticGrade {
  const unsPrefix = Math.random() > 0.5 ? 'S' : 'J';
  const unsNumber = `${unsPrefix}${30000 + index * 100 + Math.floor(Math.random() * 100)}`;

  const tensileBase = 80 + Math.floor(Math.random() * 60); // 80-140 ksi
  const yieldBase = tensileBase * (0.6 + Math.random() * 0.2); // 60-80% of tensile

  return {
    designation: `F${100 + index}`,
    unsNumber,
    chemicalComposition: generateRandomComposition(),
    tensileStrength: { min: tensileBase, unit: 'ksi' },
    yieldStrength: { min: Math.floor(yieldBase), unit: 'ksi' },
    elongation: { min: 15 + Math.floor(Math.random() * 15) }, // 15-30%
    hardness: Math.random() > 0.3 ? {
      max: 270 + Math.floor(Math.random() * 50),
      scale: 'HBW'
    } : undefined,
    heatTreatment: {
      tempMin: 1800 + Math.floor(Math.random() * 200),
      tempMax: 2000 + Math.floor(Math.random() * 150),
      quench: Math.random() > 0.5 ? 'Water quench' : 'Rapid air cool',
    },
  };
}

// ============================================
// Document Generation
// ============================================

export interface SyntheticDocument {
  title: string;
  designation: string;
  pages: string[];
  grades: SyntheticGrade[];
  metadata: {
    pageCount: number;
    tableCount: number;
    formulaCount: number;
    crossRefCount: number;
  };
}

function generateChemicalTable(grades: SyntheticGrade[]): string {
  const elements = ['C', 'Mn', 'P', 'S', 'Si', 'Ni', 'Cr', 'Mo', 'N', 'Cu'];

  let table = 'TABLE 1 Chemical Requirements\n\n';
  table += `Element\t${grades.map(g => g.designation).join('\t')}\n`;
  table += `UNS No.\t${grades.map(g => g.unsNumber).join('\t')}\n`;
  table += '-'.repeat(80) + '\n';

  for (const element of elements) {
    const values = grades.map(g => {
      const comp = g.chemicalComposition[element];
      if (!comp) return '...';
      if (comp.min !== undefined) {
        return `${comp.min}-${comp.max}`;
      }
      return comp.max.toString();
    });
    table += `${element}\t${values.join('\t')}\n`;
  }

  table += '\nNote: Values are maximums unless a range is indicated.\n';

  return table;
}

function generateMechanicalTable(grades: SyntheticGrade[]): string {
  let table = 'TABLE 2 Mechanical Requirements\n\n';
  table += 'UNS Designation\tTensile Strength, min\tYield Strength, min\tElongation %\tHardness, max\n';
  table += '-'.repeat(100) + '\n';

  for (const grade of grades) {
    const tensile = `${grade.tensileStrength.min} [${Math.round(grade.tensileStrength.min * 6.895)}]`;
    const yield_ = `${grade.yieldStrength.min} [${Math.round(grade.yieldStrength.min * 6.895)}]`;
    const hardness = grade.hardness ? `${grade.hardness.max} ${grade.hardness.scale}` : '...';

    table += `${grade.unsNumber}\t${tensile}\t${yield_}\t${grade.elongation.min}\t${hardness}\n`;
  }

  return table;
}

function generateHeatTreatmentTable(grades: SyntheticGrade[]): string {
  let table = 'TABLE 3 Heat Treatment Requirements\n\n';
  table += 'UNS Designation\tTemperature °F [°C]\tQuenching\n';
  table += '-'.repeat(80) + '\n';

  for (const grade of grades) {
    const ht = grade.heatTreatment;
    const tempF = `${ht.tempMin}-${ht.tempMax}`;
    const tempC = `${Math.round((ht.tempMin - 32) * 5 / 9)}-${Math.round((ht.tempMax - 32) * 5 / 9)}`;
    table += `${grade.unsNumber}\t${tempF} [${tempC}]\t${ht.quench}\n`;
  }

  return table;
}

function generateSection(sectionNum: number, title: string, content: string): string {
  return `${sectionNum}. ${title}\n\n${content}\n\n`;
}

function generateScopeSection(): string {
  return `1.1 This specification covers ferritic/austenitic (duplex) stainless steel forgings for boilers, pressure vessels, and associated equipment.

1.2 The purchaser may specify in the order or contract any appropriate supplementary requirements.

1.3 Unless the order specifies the applicable "M" specification designation the material shall be furnished to the inch-pound units.

1.4 The values stated in either inch-pound or SI (metric) units are to be regarded separately as standard. Within the text and tables, the SI units are shown in brackets.`;
}

function generateReferencedDocuments(): string {
  return `2.1 ASTM Standards:
A182/A182M Specification for Forged or Rolled Alloy and Stainless Steel Pipe Flanges
A370 Test Methods and Definitions for Mechanical Testing of Steel Products
A388/A388M Practice for Ultrasonic Examination of Steel Forgings
A745/A745M Practice for Ultrasonic Examination of Austenitic Steel Forgings
A788/A788M Specification for Steel Forgings, General Requirements
A923 Test Methods for Detecting Detrimental Intermetallic Phase in Duplex Steels
E165 Practice for Liquid Penetrant Examination for General Industry
G48 Test Methods for Pitting and Crevice Corrosion Resistance

2.2 Other Standards:
ASME Boiler and Pressure Vessel Code
NACE MR0175/ISO15156 Petroleum and Natural Gas Industries—Materials for Use in H₂S-Containing Environments`;
}

function generatePRENSection(): string {
  return `5.2 PREN Calculation

The Pitting Resistance Equivalent Number (PREN) shall be calculated as follows:

For non-tungsten bearing grades:
PREN = Cr + 3.3(Mo) + 16(N)

For tungsten bearing grades:
PREN = Cr + 3.3(Mo + ½W) + 16(N)

The required PREN value frequently lies between 33 and 40 depending on service experience. The purchaser shall specify the required minimum PREN value.`;
}

function generateSupplementaryRequirements(): string {
  return `SUPPLEMENTARY REQUIREMENTS

S1. Detrimental Intermetallic Phase Detection
S1.1 Forgings shall be subject to detrimental intermetallic phase detection in accordance with Test Methods A923.
S1.2 Method A of Test Methods A923 shall be followed by either Charpy impact testing (Method B) or ferric chloride corrosion test (Method C).

S2. Charpy Impact Testing
S2.1 One set of three Charpy V-Notch specimens shall be taken from each tension test location.
S2.2 Test reporting shall include absorbed energy, lateral expansion, fracture appearance, and test temperature.

S3. Corrosion Resistance
S3.1 Testing for resistance to pitting and crevice corrosion shall be carried out in accordance with Test Methods G48.

S4. Ultrasonic Examination
S4.1 Practice A388/A388M shall be used for ultrasonic examination.
S4.2 The purchaser shall specify the examination criteria.

S5. Liquid Penetrant Examination
S5.1 Liquid penetrant examination shall be done in accordance with Test Method E165.

S6. Hardness Testing
S6.1 For applications under NACE MR0175/ISO15156, hardness testing shall be done as specified.`;
}

export function generateComplexDocument(targetPages: number = 300): SyntheticDocument {
  const gradesPerBatch = 10;
  const totalGrades = Math.floor(targetPages / 6); // ~6 pages per grade set
  const grades: SyntheticGrade[] = [];

  for (let i = 0; i < totalGrades; i++) {
    grades.push(generateSyntheticGrade(i));
  }

  const pages: string[] = [];
  let currentPage = '';
  let tableCount = 0;
  let formulaCount = 0;
  let crossRefCount = 0;

  // Title page
  pages.push(`SYNTHETIC SPECIFICATION ASTM A9999/A9999M - 2024

Standard Specification for
Ferritic/Austenitic (Duplex) Stainless Steel Forgings
For Extreme Condition Testing

This specification is synthetically generated for testing purposes.
Page 1 of ${targetPages}`);

  // Scope section
  currentPage = generateSection(1, 'Scope', generateScopeSection());
  currentPage += generateSection(2, 'Referenced Documents', generateReferencedDocuments());
  pages.push(currentPage);
  crossRefCount += 10;

  // Generate chemical tables in batches
  for (let batch = 0; batch < totalGrades; batch += gradesPerBatch) {
    const batchGrades = grades.slice(batch, batch + gradesPerBatch);

    pages.push(generateChemicalTable(batchGrades));
    tableCount++;

    pages.push(generateMechanicalTable(batchGrades));
    tableCount++;

    pages.push(generateHeatTreatmentTable(batchGrades));
    tableCount++;
  }

  // PREN section with formulas
  pages.push(generateSection(5, 'Chemical Requirements', generatePRENSection()));
  formulaCount += 2;

  // Supplementary requirements
  pages.push(generateSupplementaryRequirements());

  // Fill remaining pages with detailed grade specifications
  while (pages.length < targetPages) {
    const gradeIndex = pages.length % totalGrades;
    const grade = grades[gradeIndex];

    let detailPage = `DETAILED SPECIFICATION - ${grade.designation} (${grade.unsNumber})\n\n`;
    detailPage += `6.${gradeIndex + 1} Grade ${grade.designation}\n\n`;
    detailPage += `6.${gradeIndex + 1}.1 This grade is designated as ${grade.unsNumber} in the Unified Numbering System.\n\n`;
    detailPage += `6.${gradeIndex + 1}.2 Chemical Composition:\n`;

    for (const [element, comp] of Object.entries(grade.chemicalComposition)) {
      const elemName = CHEMICAL_ELEMENTS[element as keyof typeof CHEMICAL_ELEMENTS]?.name || element;
      if (comp.min !== undefined) {
        detailPage += `  ${elemName} (${element}): ${comp.min}% to ${comp.max}%\n`;
      } else {
        detailPage += `  ${elemName} (${element}): ${comp.max}% maximum\n`;
      }
    }

    detailPage += `\n6.${gradeIndex + 1}.3 Mechanical Properties:\n`;
    detailPage += `  Tensile Strength: ${grade.tensileStrength.min} ksi [${Math.round(grade.tensileStrength.min * 6.895)} MPa] minimum\n`;
    detailPage += `  Yield Strength (0.2% offset): ${grade.yieldStrength.min} ksi [${Math.round(grade.yieldStrength.min * 6.895)} MPa] minimum\n`;
    detailPage += `  Elongation in 2 in. [50 mm]: ${grade.elongation.min}% minimum\n`;

    if (grade.hardness) {
      detailPage += `  Hardness: ${grade.hardness.max} ${grade.hardness.scale} maximum\n`;
    }

    detailPage += `\n6.${gradeIndex + 1}.4 Heat Treatment:\n`;
    detailPage += `  Temperature: ${grade.heatTreatment.tempMin}-${grade.heatTreatment.tempMax}°F `;
    detailPage += `[${Math.round((grade.heatTreatment.tempMin - 32) * 5 / 9)}-${Math.round((grade.heatTreatment.tempMax - 32) * 5 / 9)}°C]\n`;
    detailPage += `  Quench: ${grade.heatTreatment.quench}\n`;

    // Add cross-references
    detailPage += `\n6.${gradeIndex + 1}.5 See also:\n`;
    detailPage += `  - Section 7 for testing requirements\n`;
    detailPage += `  - Table 1 for complete chemical composition\n`;
    detailPage += `  - Table 2 for mechanical properties\n`;
    detailPage += `  - Supplementary Requirement S1 for intermetallic phase detection\n`;
    crossRefCount += 4;

    pages.push(detailPage);
  }

  return {
    title: 'ASTM A9999 Synthetic Specification',
    designation: 'A9999/A9999M',
    pages,
    grades,
    metadata: {
      pageCount: pages.length,
      tableCount,
      formulaCount,
      crossRefCount,
    },
  };
}

export function generateEdgeCaseDocument(targetPages: number = 300): SyntheticDocument {
  const grades = Array.from({ length: 30 }, (_, i) => generateSyntheticGrade(i + 100));
  const pages: string[] = [];

  // Title with special characters
  pages.push(`SYNTHETIC EDGE CASE SPECIFICATION ASTM A8888/A8888M™ - 2024

Standard Specification for
Ferritic/Austenitic (Duplex) Stainless Steel
With Enhanced Corrosion Resistance (≥PREN 40)

Note: Contains special characters: ±, ≥, ≤, °, µ, ², ³, α, β, γ, δ, σ

Page 1 of ${targetPages}`);

  // Section with heavy acronym usage
  pages.push(`DEFINITIONS AND ACRONYMS

ASTM - American Society for Testing and Materials
UNS - Unified Numbering System
PREN - Pitting Resistance Equivalent Number
PRE - Pitting Resistance Equivalent (alternate)
CPT - Critical Pitting Temperature
CCT - Critical Crevice Temperature
HAZ - Heat Affected Zone
PWHT - Post-Weld Heat Treatment
NDT - Non-Destructive Testing
UT - Ultrasonic Testing
MT - Magnetic Particle Testing
PT - Liquid Penetrant Testing
RT - Radiographic Testing
VT - Visual Testing
HB/HBW - Brinell Hardness
HRC - Rockwell Hardness C-scale
HRB - Rockwell Hardness B-scale
NACE - National Association of Corrosion Engineers
ISO - International Organization for Standardization
ASME - American Society of Mechanical Engineers
AWS - American Welding Society
API - American Petroleum Institute
AISI - American Iron and Steel Institute
EN - European Norm
DIN - Deutsches Institut für Normung
JIS - Japanese Industrial Standards
GB - Guobiao (Chinese National Standard)
GOST - Russian State Standard`);

  // Non-standard symbols section
  pages.push(`SPECIAL NOTATION

The following symbols are used in this specification:

± Tolerance indicator (plus or minus)
≥ Greater than or equal to
≤ Less than or equal to
° Degrees (temperature)
°C Degrees Celsius
°F Degrees Fahrenheit
µm Micrometers (10⁻⁶ meters)
% Percent
‰ Per mille (parts per thousand)
√ Square root
∑ Summation
∆ Delta (change)
Ω Ohms (electrical resistance)
α Alpha phase (ferrite in duplex)
γ Gamma phase (austenite in duplex)
σ Sigma phase (detrimental intermetallic)
χ Chi phase (detrimental intermetallic)
H₂S Hydrogen sulfide
CO₂ Carbon dioxide
Fe₃O₄ Magnetite
NaCl Sodium chloride
FeCl₃ Ferric chloride (test solution)

Superscripts and subscripts:
x² = x squared
x³ = x cubed
H₂O = water
CO₂ = carbon dioxide
10⁻⁶ = one millionth`);

  // Complex formula section
  pages.push(`CORROSION RESISTANCE CALCULATIONS

A.1 Pitting Resistance Equivalent Number (PREN)

For standard duplex grades:
PREN = %Cr + 3.3 × %Mo + 16 × %N

For tungsten-bearing grades:
PREN = %Cr + 3.3 × (%Mo + 0.5 × %W) + 16 × %N

For super duplex grades (enhanced formula):
PRENW = %Cr + 3.3 × (%Mo + 0.5 × %W) + 16 × %N + 1.65 × %Cu

A.2 Critical Pitting Temperature (CPT)

Estimated CPT (°C) = 2.5 × PREN - 50 (±5°C tolerance)

Example calculation for Grade F108 (UNS S31008):
  Cr = 24.5%, Mo = 3.2%, N = 0.28%, W = 0%
  PREN = 24.5 + 3.3(3.2) + 16(0.28) = 24.5 + 10.56 + 4.48 = 39.54
  CPT ≈ 2.5 × 39.54 - 50 = 48.85°C ≈ 49°C

A.3 Ferrite Content

Ferrite Number (FN) = f(Cr_eq, Ni_eq) per AWS A4.2

Where:
  Cr_eq = %Cr + %Mo + 0.7 × %Nb
  Ni_eq = %Ni + 35 × %C + 20 × %N + 0.25 × %Cu

Target ferrite content: 40-60% (balance austenite)`);

  // Generate remaining pages with edge cases
  while (pages.length < targetPages) {
    const pageType = pages.length % 5;

    switch (pageType) {
      case 0:
        // Table with footnotes and superscripts
        pages.push(generateComplexTable(grades.slice(0, 10)));
        break;
      case 1:
        // Section with external references
        pages.push(generateExternalReferences());
        break;
      case 2:
        // Section with multi-level numbering
        pages.push(generateMultiLevelSection(pages.length));
        break;
      case 3:
        // Section with unit conversions
        pages.push(generateUnitConversionTable());
        break;
      case 4:
        // Appendix with complex formatting
        pages.push(generateAppendixSection(pages.length));
        break;
    }
  }

  return {
    title: 'ASTM A8888 Edge Case Specification',
    designation: 'A8888/A8888M',
    pages,
    grades,
    metadata: {
      pageCount: pages.length,
      tableCount: Math.floor(targetPages / 5),
      formulaCount: 15,
      crossRefCount: Math.floor(targetPages / 3),
    },
  };
}

function generateComplexTable(grades: SyntheticGrade[]): string {
  let table = 'TABLE X Chemical Requirements with Footnotes\n\n';
  table += 'Element | Grade F100ᴬ | Grade F101ᴮ | Grade F102ᶜ | Notes\n';
  table += '--------|------------|------------|------------|-------\n';
  table += 'C       | 0.030 max  | 0.025 max  | 0.030 max  | ᴰ\n';
  table += 'Cr      | 21.0-23.0  | 24.0-26.0  | 24.0-26.0  | ᴱ\n';
  table += 'Ni      | 4.5-6.5    | 6.0-8.0    | 5.5-8.0    | -\n';
  table += 'Mo      | 2.5-3.5    | 3.0-5.0    | 3.0-5.0    | ᶠ\n';
  table += 'N       | 0.08-0.20  | 0.24-0.32  | 0.20-0.35  | ᴳ\n';
  table += 'Cu      | 0.50 max   | 0.50 max   | 0.50-3.00  | ᴴ\n';
  table += 'W       | ...        | ...        | 0.50-1.00  | ᴵ\n\n';

  table += 'Footnotes:\n';
  table += 'ᴬ For general corrosive service\n';
  table += 'ᴮ For high chloride environments (PREN ≥ 40)\n';
  table += 'ᶜ For sour service per NACE MR0175\n';
  table += 'ᴰ Carbon content controls weldability and sensitization resistance\n';
  table += 'ᴱ Chromium provides primary corrosion resistance\n';
  table += 'ᶠ Molybdenum enhances pitting resistance\n';
  table += 'ᴳ Nitrogen is an austenite stabilizer and strengthener\n';
  table += 'ᴴ Copper optional for sulfuric acid resistance\n';
  table += 'ᴵ Tungsten bearing grades per PREN formula variant\n';
  table += '\n"..." indicates no requirement or not applicable\n';

  return table;
}

function generateExternalReferences(): string {
  return `REFERENCES TO EXTERNAL STANDARDS

This specification makes reference to the following external documents:

International Standards:
- ISO 15156-1:2020 Petroleum and natural gas industries—Materials for use in H₂S-containing environments
- ISO 15156-2:2020 Part 2: Cracking-resistant carbon and low-alloy steels
- ISO 15156-3:2020 Part 3: Cracking-resistant CRAs and other alloys
- ISO 17781:2017 Petroleum, petrochemical and natural gas industries—Test methods
- ISO 148-1:2016 Metallic materials—Charpy pendulum impact test—Part 1: Test method

European Standards:
- EN 10088-1:2014 Stainless steels—Part 1: List of stainless steels
- EN 10088-2:2014 Part 2: Technical delivery conditions for sheet/plate
- EN 10088-3:2014 Part 3: Technical delivery conditions for semi-finished products
- EN 10216-5:2013 Seamless steel tubes for pressure purposes

National Standards:
- ASTM A240/A240M Standard Specification for Chromium and Chromium-Nickel Stainless Steel Plate
- ASTM A480/A480M General Requirements for Flat-Rolled Stainless and Heat-Resisting Steel
- JIS G4304:2012 Hot-rolled stainless steel plate, sheet and strip
- GB/T 1220-2007 Stainless steel bars

Industry Standards:
- NACE MR0175/ISO 15156 Materials for use in H₂S-containing environments
- NACE TM0177 Laboratory Testing of Metals for Resistance to SSC
- API 5L Specification for Line Pipe
- AWS A5.9/A5.9M Bare Stainless Steel Welding Electrodes and Rods`;
}

function generateMultiLevelSection(sectionNum: number): string {
  const base = Math.floor(sectionNum / 10) + 7;

  return `${base}. TESTING REQUIREMENTS

${base}.1 General
${base}.1.1 All testing shall be performed by qualified personnel.
${base}.1.1.1 Qualification shall be per SNT-TC-1A or equivalent.
${base}.1.1.2 Records of qualification shall be maintained.
${base}.1.1.2.1 Records shall include name, date of qualification, and methods qualified.
${base}.1.1.2.2 Requalification required every 3 years.

${base}.1.2 Test Equipment
${base}.1.2.1 All equipment shall be calibrated.
${base}.1.2.1.1 Calibration interval: 12 months maximum.
${base}.1.2.1.2 Calibration records shall be traceable to national standards.

${base}.2 Mechanical Testing
${base}.2.1 Tension Testing
${base}.2.1.1 Specimens shall conform to ASTM A370.
${base}.2.1.2 Testing temperature: 70±10°F [21±6°C]
${base}.2.1.3 Strain rate: 0.005 to 0.003 in./in./min during yield determination

${base}.2.2 Impact Testing
${base}.2.2.1 When specified, Charpy V-notch tests shall be performed.
${base}.2.2.2 Specimen orientation: longitudinal (primary) or transverse (if specified)
${base}.2.2.3 Test temperature: as specified by purchaser or per code requirements

${base}.3 Non-Destructive Examination
${base}.3.1 Visual Examination (VT)
${base}.3.1.1 All accessible surfaces shall be examined.
${base}.3.2 Liquid Penetrant Examination (PT)
${base}.3.2.1 Per ASTM E165 using Method A (water washable) or Method C (solvent removable)
${base}.3.3 Ultrasonic Examination (UT)
${base}.3.3.1 Per ASTM A388/A388M or A745/A745M as applicable`;
}

function generateUnitConversionTable(): string {
  return `UNIT CONVERSION REFERENCE

TABLE U1 - Stress/Strength Conversions
| ksi    | MPa    | kg/mm²  | psi      |
|--------|--------|---------|----------|
| 1      | 6.895  | 0.703   | 1000     |
| 10     | 68.95  | 7.03    | 10000    |
| 50     | 344.7  | 35.15   | 50000    |
| 80     | 551.6  | 56.24   | 80000    |
| 100    | 689.5  | 70.3    | 100000   |
| 120    | 827.4  | 84.36   | 120000   |

TABLE U2 - Temperature Conversions
| °F     | °C     | K       |
|--------|--------|---------|
| -40    | -40    | 233     |
| 0      | -18    | 255     |
| 32     | 0      | 273     |
| 70     | 21     | 294     |
| 212    | 100    | 373     |
| 1700   | 927    | 1200    |
| 1900   | 1038   | 1311    |
| 2100   | 1149   | 1422    |

TABLE U3 - Length/Thickness Conversions
| in.    | mm     | µm      |
|--------|--------|---------|
| 0.001  | 0.025  | 25.4    |
| 0.004  | 0.102  | 101.6   |
| 0.010  | 0.254  | 254     |
| 0.125  | 3.175  | 3175    |
| 0.250  | 6.35   | 6350    |
| 0.500  | 12.70  | 12700   |
| 1.000  | 25.40  | 25400   |

Conversion Formulas:
°C = (°F - 32) × 5/9
°F = (°C × 9/5) + 32
K = °C + 273.15
MPa = ksi × 6.894757
mm = in. × 25.4`;
}

function generateAppendixSection(appendixNum: number): string {
  const letter = String.fromCharCode(65 + (appendixNum % 26));

  return `APPENDIX ${letter}
(Nonmandatory Information)

${letter}1. SCOPE
${letter}1.1 This appendix provides supplementary information for guidance.
${letter}1.2 Requirements herein are not mandatory unless specifically invoked.

${letter}2. TYPICAL APPLICATIONS

${letter}2.1 Process Industries
${letter}2.1.1 Chemical processing equipment
${letter}2.1.2 Pulp and paper production
${letter}2.1.3 Desalination plants
${letter}2.1.4 Food and beverage processing

${letter}2.2 Oil and Gas
${letter}2.2.1 Offshore platforms and risers
${letter}2.2.2 Subsea equipment
${letter}2.2.3 Pipeline systems
${letter}2.2.4 Topside process equipment

${letter}2.3 Marine Applications
${letter}2.3.1 Propeller shafts
${letter}2.3.2 Pump casings
${letter}2.3.3 Heat exchangers
${letter}2.3.4 Seawater systems

${letter}3. CORROSION DATA

Typical corrosion rates in various environments (mpy = mils per year):

| Environment                  | Duplex | Super Duplex |
|-----------------------------|--------|--------------|
| Seawater (ambient)          | <0.1   | <0.01        |
| 10% H₂SO₄ (boiling)         | <5     | <2           |
| 10% HNO₃ (boiling)          | <1     | <0.5         |
| 3.5% NaCl + CO₂ (80°C)      | <0.1   | <0.01        |
| Produced water (150°F)      | <1     | <0.5         |

Note: Actual corrosion rates depend on specific conditions including temperature,
aeration, velocity, and presence of other species. Testing recommended for
critical applications.`;
}

// ============================================
// Export functions for test use
// ============================================

export function getSyntheticDocumentText(doc: SyntheticDocument): string {
  return doc.pages.join('\n\n--- PAGE BREAK ---\n\n');
}

export function getDocumentStatistics(doc: SyntheticDocument) {
  const fullText = getSyntheticDocumentText(doc);
  const words = fullText.split(/\s+/).length;
  const chars = fullText.length;
  const avgCharsPerPage = Math.round(chars / doc.pages.length);

  return {
    ...doc.metadata,
    wordCount: words,
    charCount: chars,
    avgCharsPerPage,
    gradeCount: doc.grades.length,
  };
}
