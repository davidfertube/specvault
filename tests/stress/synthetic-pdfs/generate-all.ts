/**
 * Generate Synthetic PDFs for Stress Testing
 *
 * Creates 3 test PDFs with varying complexity levels:
 * - Simple: 1 page, basic table
 * - Medium: 15 pages, multiple sections
 * - Complex: 50 pages, formulas, detailed tables
 */

import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_DIR = __dirname;

// ============================================================================
// SIMPLE PDF: 1-page specification sheet
// ============================================================================

function generateSimplePDF() {
  const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
  const outputPath = path.join(OUTPUT_DIR, 'astm-a999-simple.pdf');
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Title
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .text('ASTM A999 - Synthetic Test Specification', { align: 'center' });

  doc.moveDown();
  doc.fontSize(12).font('Helvetica')
     .text('Scope: This specification covers seamless and welded synthetic test materials.');

  doc.moveDown(2);

  // Mechanical Properties Table
  doc.fontSize(14).font('Helvetica-Bold')
     .text('Table 1: Mechanical Properties');

  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');

  const tableData = [
    ['Grade', 'Yield Strength (ksi)', 'Tensile Strength (ksi)', 'Elongation (%)'],
    ['A', '50', '75', '30'],
    ['B', '65', '95', '25'],
    ['C', '80', '110', '20'],
  ];

  let yPosition = doc.y;
  const columnWidths = [100, 130, 150, 110];
  const cellHeight = 20;

  // Table header
  doc.font('Helvetica-Bold');
  let xPosition = 50;
  tableData[0].forEach((header, i) => {
    doc.rect(xPosition, yPosition, columnWidths[i], cellHeight).stroke();
    doc.text(header, xPosition + 5, yPosition + 5, { width: columnWidths[i] - 10 });
    xPosition += columnWidths[i];
  });

  // Table rows
  doc.font('Helvetica');
  yPosition += cellHeight;
  for (let i = 1; i < tableData.length; i++) {
    xPosition = 50;
    tableData[i].forEach((cell, j) => {
      doc.rect(xPosition, yPosition, columnWidths[j], cellHeight).stroke();
      doc.text(cell, xPosition + 5, yPosition + 5, { width: columnWidths[j] - 10 });
      xPosition += columnWidths[j];
    });
    yPosition += cellHeight;
  }

  doc.y = yPosition + 30;

  // Chemical Composition
  doc.fontSize(14).font('Helvetica-Bold')
     .text('Table 2: Chemical Composition');

  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('Carbon (C): 0.03% max');
  doc.text('Chromium (Cr): 22.0-24.0%');
  doc.text('Nickel (Ni): 4.5-6.5%');
  doc.text('Molybdenum (Mo): 3.0-3.5%');
  doc.text('Nitrogen (N): 0.14-0.20%');

  doc.moveDown(2);

  // UNS Designation
  doc.fontSize(12).font('Helvetica-Bold')
     .text('UNS Designation:');
  doc.fontSize(10).font('Helvetica')
     .text('Grade A: UNS S99901');
  doc.text('Grade B: UNS S99902');
  doc.text('Grade C: UNS S99903');

  doc.end();

  return new Promise((resolve) => {
    stream.on('finish', () => {
      console.log(`✓ Generated: ${outputPath}`);
      resolve(outputPath);
    });
  });
}

// ============================================================================
// MEDIUM PDF: 15-page standard with multiple sections
// ============================================================================

function generateMediumPDF() {
  const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
  const outputPath = path.join(OUTPUT_DIR, 'astm-a998-medium.pdf');
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Cover Page
  doc.fontSize(24).font('Helvetica-Bold')
     .text('ASTM A998', { align: 'center' });
  doc.moveDown();
  doc.fontSize(18)
     .text('Standard Specification for', { align: 'center' });
  doc.text('Synthetic Test Materials - Medium', { align: 'center' });
  doc.moveDown(3);
  doc.fontSize(12).font('Helvetica')
     .text('This standard is issued under the fixed designation A998', { align: 'center' });

  // Section 1: Scope
  doc.addPage();
  doc.fontSize(16).font('Helvetica-Bold')
     .text('1. Scope');
  doc.moveDown();
  doc.fontSize(11).font('Helvetica')
     .text('1.1 This specification covers seamless and welded synthetic test materials for stress testing purposes.')
     .text('1.2 The materials are furnished in various grades to simulate different complexity levels.')
     .text('1.3 Supplementary requirements are provided for when additional testing is required.');

  // Section 2: Referenced Documents
  doc.moveDown(2);
  doc.fontSize(16).font('Helvetica-Bold')
     .text('2. Referenced Documents');
  doc.moveDown();
  doc.fontSize(11).font('Helvetica')
     .text('2.1 ASTM Standards:')
     .text('  A999 Specification for Simple Test Materials')
     .text('  A997 Specification for Complex Test Materials')
     .text('  E112 Test Methods for Determining Average Grain Size');

  // Section 3: Terminology
  doc.addPage();
  doc.fontSize(16).font('Helvetica-Bold')
     .text('3. Terminology');
  doc.moveDown();
  doc.fontSize(11).font('Helvetica')
     .text('3.1 Definitions:')
     .text('  3.1.1 grade - a designation used to identify a specific combination of properties.')
     .text('  3.1.2 synthetic - artificially created for testing purposes.')
     .text('  3.1.3 stress test - evaluation under simulated load conditions.');

  // Section 4: Ordering Information
  doc.moveDown(2);
  doc.fontSize(16).font('Helvetica-Bold')
     .text('4. Ordering Information');
  doc.moveDown();
  doc.fontSize(11).font('Helvetica')
     .text('4.1 Orders shall include the following information:')
     .text('  4.1.1 ASTM designation and year of issue')
     .text('  4.1.2 Grade (see Table 1)')
     .text('  4.1.3 Size, dimensions, and quantity');

  // Section 5: Materials and Manufacture
  doc.addPage();
  doc.fontSize(16).font('Helvetica-Bold')
     .text('5. Materials and Manufacture');
  doc.moveDown();
  doc.fontSize(11).font('Helvetica')
     .text('5.1 The material shall be manufactured by synthetic generation processes.')
     .text('5.2 Heat treatment shall be performed as specified in Section 6.')
     .text('5.3 Quality control measures shall ensure consistency across test samples.');

  // Section 6: Heat Treatment
  doc.moveDown(2);
  doc.fontSize(16).font('Helvetica-Bold')
     .text('6. Heat Treatment');
  doc.moveDown();
  doc.fontSize(11).font('Helvetica')
     .text('6.1 Solution Annealing: Heat to 1100°C (2012°F), hold for 1 hour, rapid cool.')
     .text('6.2 Stress Relief: Heat to 200°C (392°F), hold for 30 minutes, air cool.')
     .text('6.3 Alternative treatments may be specified by purchaser.');

  // Section 7: Chemical Composition
  doc.addPage();
  doc.fontSize(16).font('Helvetica-Bold')
     .text('7. Chemical Composition');
  doc.moveDown();
  doc.fontSize(11).font('Helvetica')
     .text('7.1 The material shall conform to the chemical composition limits in Table 3.');

  doc.moveDown();
  doc.fontSize(12).font('Helvetica-Bold')
     .text('Table 3: Chemical Composition Requirements (%)');

  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');

  const chemTable = [
    ['Element', 'Grade X', 'Grade Y', 'Grade Z'],
    ['Carbon (C)', '0.03 max', '0.05 max', '0.08 max'],
    ['Chromium (Cr)', '22.0-24.0', '24.0-26.0', '20.0-22.0'],
    ['Nickel (Ni)', '4.5-6.5', '5.5-7.5', '8.0-10.5'],
    ['Molybdenum (Mo)', '3.0-3.5', '2.5-3.5', '2.0-3.0'],
    ['Nitrogen (N)', '0.14-0.20', '0.18-0.25', '0.08-0.14'],
  ];

  const chemColWidths = [120, 100, 100, 100];
  let yPos = doc.y;
  const rowHeight = 25;

  // Header
  doc.font('Helvetica-Bold');
  let xPos = 50;
  chemTable[0].forEach((header, i) => {
    doc.rect(xPos, yPos, chemColWidths[i], rowHeight).stroke();
    doc.text(header, xPos + 5, yPos + 8, { width: chemColWidths[i] - 10 });
    xPos += chemColWidths[i];
  });

  // Rows
  doc.font('Helvetica');
  yPos += rowHeight;
  for (let i = 1; i < chemTable.length; i++) {
    xPos = 50;
    chemTable[i].forEach((cell, j) => {
      doc.rect(xPos, yPos, chemColWidths[j], rowHeight).stroke();
      doc.text(cell, xPos + 5, yPos + 8, { width: chemColWidths[j] - 10 });
      xPos += chemColWidths[j];
    });
    yPos += rowHeight;
  }

  // Section 8: Mechanical Properties (continued on next pages...)
  doc.addPage();
  doc.fontSize(16).font('Helvetica-Bold')
     .text('8. Mechanical Properties');
  doc.moveDown();
  doc.fontSize(11).font('Helvetica')
     .text('8.1 Tensile properties shall meet the requirements specified in Table 4.')
     .text('8.2 Hardness values shall not exceed the maximum specified.')
     .text('8.3 Impact testing shall be performed at -20°C (-4°F).');

  doc.moveDown();
  doc.fontSize(12).font('Helvetica-Bold')
     .text('Table 4: Tensile Requirements');

  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');

  const mechTable = [
    ['Grade', 'Yield (ksi)', 'Tensile (ksi)', 'Elongation (%)', 'Hardness (HB)'],
    ['X', '65', '95', '25', '220 max'],
    ['Y', '75', '105', '22', '240 max'],
    ['Z', '55', '85', '30', '200 max'],
  ];

  const mechColWidths = [80, 95, 110, 115, 115];
  yPos = doc.y;

  // Header
  doc.font('Helvetica-Bold');
  xPos = 50;
  mechTable[0].forEach((header, i) => {
    doc.rect(xPos, yPos, mechColWidths[i], rowHeight).stroke();
    doc.text(header, xPos + 5, yPos + 8, { width: mechColWidths[i] - 10 });
    xPos += mechColWidths[i];
  });

  // Rows
  doc.font('Helvetica');
  yPos += rowHeight;
  for (let i = 1; i < mechTable.length; i++) {
    xPos = 50;
    mechTable[i].forEach((cell, j) => {
      doc.rect(xPos, yPos, mechColWidths[j], rowHeight).stroke();
      doc.text(cell, xPos + 5, yPos + 8, { width: mechColWidths[j] - 10 });
      xPos += mechColWidths[j];
    });
    yPos += rowHeight;
  }

  // Add more pages with filler content to reach 15 pages
  for (let page = 9; page <= 15; page++) {
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold')
       .text(`${page}. Additional Requirements`);
    doc.moveDown();
    doc.fontSize(11).font('Helvetica')
       .text(`${page}.1 This section contains supplementary requirements for special applications.`)
       .text(`${page}.2 Consult with manufacturer for specific testing procedures.`)
       .text(`${page}.3 Additional certifications may be required based on end-use.`);
  }

  doc.end();

  return new Promise((resolve) => {
    stream.on('finish', () => {
      console.log(`✓ Generated: ${outputPath}`);
      resolve(outputPath);
    });
  });
}

// ============================================================================
// COMPLEX PDF: 50-page specification with formulas and detailed tables
// ============================================================================

function generateComplexPDF() {
  const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
  const outputPath = path.join(OUTPUT_DIR, 'astm-a997-complex.pdf');
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Cover Page
  doc.fontSize(24).font('Helvetica-Bold')
     .text('ASTM A997', { align: 'center' });
  doc.moveDown();
  doc.fontSize(18)
     .text('Standard Specification for', { align: 'center' });
  doc.text('Synthetic Test Materials - Complex', { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(14)
     .text('With Formulas and Detailed Analysis', { align: 'center' });

  // Table of Contents
  doc.addPage();
  doc.fontSize(18).font('Helvetica-Bold')
     .text('Table of Contents');
  doc.moveDown();
  doc.fontSize(11).font('Helvetica');

  const toc = [
    '1. Scope ................................................. 3',
    '2. Referenced Documents ............................... 4',
    '3. Terminology ........................................ 5',
    '4. Classification ..................................... 6',
    '5. Ordering Information ............................... 7',
    '6. Materials and Manufacture .......................... 8',
    '7. Heat Treatment .................................... 10',
    '8. Chemical Composition .............................. 12',
    '9. Mechanical Properties ............................. 15',
    '10. Corrosion Testing ................................ 20',
    '11. Hydrostatic Test Pressure Calculations ........... 25',
    '12. Quality Assurance ................................ 30',
    'Appendix A: Test Methods ............................. 35',
    'Appendix B: Acceptance Criteria ...................... 40',
    'Index ................................................. 45',
  ];

  toc.forEach(item => doc.text(item));

  // Add detailed sections (simplified for brevity, but creates 50 pages)
  for (let section = 1; section <= 15; section++) {
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold')
       .text(`${section}. Section ${section}`);
    doc.moveDown();
    doc.fontSize(11).font('Helvetica');

    // Add formula example in section 11
    if (section === 11) {
      doc.fontSize(14).font('Helvetica-Bold')
         .text('11.1 Hydrostatic Test Pressure Formula');
      doc.moveDown();
      doc.fontSize(11).font('Helvetica')
         .text('The minimum hydrostatic test pressure shall be calculated using:');
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Oblique')
         .text('P = (2 × S × t) / D');
      doc.moveDown();
      doc.fontSize(11).font('Helvetica')
         .text('Where:')
         .text('  P = test pressure (psi)')
         .text('  S = allowable stress (psi)')
         .text('  t = wall thickness (inches)')
         .text('  D = outside diameter (inches)');
      doc.moveDown();
      doc.text('Example Calculation:');
      doc.text('For a pipe with D = 10 inches, t = 0.375 inches, S = 20,000 psi:');
      doc.text('P = (2 × 20,000 × 0.375) / 10 = 1,500 psi');
    }

    // Fill rest of page with content
    for (let para = 1; para <= 8; para++) {
      doc.text(`${section}.${para} This is detailed technical content for section ${section}, paragraph ${para}. The specification outlines requirements for materials, testing procedures, acceptance criteria, and quality assurance measures. Compliance with this standard ensures product integrity and performance characteristics meet industry requirements.`);
      doc.moveDown();
    }

    // Add 2 more pages per section to reach 50 total
    doc.addPage();
    doc.fontSize(11).font('Helvetica')
       .text(`${section} (continued)`);
    doc.moveDown();

    for (let para = 9; para <= 15; para++) {
      doc.text(`${section}.${para} Additional requirements and specifications continue here with detailed technical information, test methods, and acceptance criteria for various product forms and conditions.`);
      doc.moveDown();
    }

    doc.addPage();
    doc.fontSize(11).font('Helvetica')
       .text(`${section} (continued)`);
    doc.moveDown();

    for (let para = 16; para <= 20; para++) {
      doc.text(`${section}.${para} Further elaboration on testing procedures, quality control measures, and documentation requirements to ensure compliance with specification requirements.`);
      doc.moveDown();
    }
  }

  // Add index pages to reach 50
  doc.addPage();
  doc.fontSize(18).font('Helvetica-Bold')
     .text('Index');
  doc.moveDown();
  doc.fontSize(10).font('Helvetica');

  const indexTerms = [
    'Acceptance Criteria',
    'Chemical Composition',
    'Corrosion Testing',
    'Grade Designation',
    'Heat Treatment',
    'Hydrostatic Testing',
    'Mechanical Properties',
    'Quality Assurance',
    'Test Methods',
    'UNS Designation',
  ];

  indexTerms.forEach(term => {
    doc.text(`${term} ........................................... see various pages`);
  });

  doc.end();

  return new Promise((resolve) => {
    stream.on('finish', () => {
      console.log(`✓ Generated: ${outputPath}`);
      resolve(outputPath);
    });
  });
}

// ============================================================================
// Main execution
// ============================================================================

async function generateAll() {
  console.log('Generating synthetic PDFs for stress testing...\n');

  try {
    await generateSimplePDF();
    await generateMediumPDF();
    await generateComplexPDF();

    console.log('\n✅ All synthetic PDFs generated successfully!');
    console.log('\nFiles created:');
    console.log('  - astm-a999-simple.pdf (1 page)');
    console.log('  - astm-a998-medium.pdf (15 pages)');
    console.log('  - astm-a997-complex.pdf (50 pages)');
  } catch (error) {
    console.error('Error generating PDFs:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  generateAll();
}

export { generateSimplePDF, generateMediumPDF, generateComplexPDF };
