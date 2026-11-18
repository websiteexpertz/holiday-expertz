/**
 * Holiday Expertz — Safe INR to USD Database & Storage Migration Script
 *
 * Usage:
 *   node scripts/migrate_inr_to_usd.cjs --dry-run   (Preview only, default)
 *   node scripts/migrate_inr_to_usd.cjs --execute   (Applies changes with timestamped backup)
 */

const fs = require('fs');
const path = require('path');

// Reference Exchange Rate: 1 USD = 84.40 INR (RBI Reference / November 2024 benchmark)
const EXCHANGE_RATE_USD_INR = 84.40;

const isExecute = process.argv.includes('--execute');
const isDryRun = !isExecute;

const propertiesJsonPath = path.resolve(__dirname, '../backend/src/data/properties.json');

function convertInrToUsd(amount) {
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) return 0;
  // Round to nearest integer dollar for luxury property base rates
  return Math.round(amount / EXCHANGE_RATE_USD_INR);
}

function runMigration() {
  console.log('===============================================================');
  console.log('  HOLIDAY EXPERTZ — INR TO USD MIGRATION UTILITY');
  console.log(`  Mode: ${isExecute ? '🔴 LIVE EXECUTION (--execute)' : '🟢 DRY RUN (--dry-run)'}`);
  console.log(`  Reference Rate: 1 USD = ${EXCHANGE_RATE_USD_INR} INR`);
  console.log('===============================================================\n');

  if (!fs.existsSync(propertiesJsonPath)) {
    console.error(`Error: File not found at ${propertiesJsonPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(propertiesJsonPath, 'utf8');
  let properties = [];
  try {
    properties = JSON.parse(rawData);
  } catch (err) {
    console.error('Failed to parse properties.json:', err.message);
    process.exit(1);
  }

  console.log(`Loaded ${properties.length} properties from storage.\n`);

  let convertedCount = 0;
  let skippedCount = 0;
  let flaggedCount = 0;

  const previewTable = [];

  const updatedProperties = properties.map((prop) => {
    const propId = prop.id || prop._id;
    const propNum = prop.propertyNumber || 'N/A';
    const name = prop.name || 'Untitled';
    const currentCurrency = prop.pricing?.currency || 'INR';
    const oldPrice = prop.pricing?.pricePerNight || 0;
    const oldOriginalPrice = prop.pricing?.originalPrice || 0;

    // Check if already USD
    if (currentCurrency === 'USD') {
      skippedCount++;
      previewTable.push({
        Property: `${propNum} (${name.slice(0, 18)})`,
        Currency: 'USD',
        'Old Base': `$${oldPrice}`,
        'New Base': `$${oldPrice}`,
        Status: 'Skipped (Already USD)'
      });
      return prop;
    }

    // Check if non-INR (e.g. CHF)
    if (currentCurrency !== 'INR') {
      flaggedCount++;
      previewTable.push({
        Property: `${propNum} (${name.slice(0, 18)})`,
        Currency: currentCurrency,
        'Old Base': `${oldPrice} ${currentCurrency}`,
        'New Base': `${oldPrice} ${currentCurrency}`,
        Status: 'FLAGGED (Non-INR manual review)'
      });
      return prop;
    }

    // Convert INR to USD
    const newPriceUsd = convertInrToUsd(oldPrice);
    const newOriginalPriceUsd = oldOriginalPrice > 0 ? convertInrToUsd(oldOriginalPrice) : 0;
    convertedCount++;

    previewTable.push({
      Property: `${propNum} (${name.slice(0, 18)})`,
      Currency: 'INR ➔ USD',
      'Old Base': `₹${oldPrice.toLocaleString()}`,
      'New Base': `$${newPriceUsd.toLocaleString()}`,
      Status: isExecute ? 'Converted' : 'Will Convert'
    });

    return {
      ...prop,
      pricing: {
        ...prop.pricing,
        currency: 'USD',
        pricePerNight: newPriceUsd,
        originalPrice: newOriginalPriceUsd > 0 ? newOriginalPriceUsd : undefined,
        historicalInrPricing: {
          pricePerNight: oldPrice,
          originalPrice: oldOriginalPrice,
          convertedAt: new Date().toISOString(),
          rateUsed: EXCHANGE_RATE_USD_INR
        }
      },
      migrationVersion: '1.0.0-usd',
      migratedAt: new Date().toISOString()
    };
  });

  console.table(previewTable);

  console.log('\n---------------------------------------------------------------');
  console.log(`Summary:`);
  console.log(`  Total Properties:   ${properties.length}`);
  console.log(`  Converted to USD:   ${convertedCount}`);
  console.log(`  Already in USD:     ${skippedCount}`);
  console.log(`  Flagged (Non-INR):  ${flaggedCount}`);
  console.log('---------------------------------------------------------------\n');

  if (isDryRun) {
    console.log('🟢 DRY-RUN COMPLETE: No files or database records were modified.');
    console.log('To apply these conversions, run with explicit flag: node scripts/migrate_inr_to_usd.cjs --execute');
    return;
  }

  // Backup before writing
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.resolve(__dirname, `../backend/src/data/properties.backup.${timestamp}.json`);
  fs.writeFileSync(backupPath, rawData, 'utf8');
  console.log(`💾 Backup created successfully at: ${backupPath}`);

  // Save converted properties
  fs.writeFileSync(propertiesJsonPath, JSON.stringify(updatedProperties, null, 2), 'utf8');
  console.log(`✅ Updated ${propertiesJsonPath} with converted USD rates.`);
}

runMigration();
