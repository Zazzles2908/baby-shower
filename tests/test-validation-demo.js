/**
 * Quick Validation Test - Run this to see the new error messages
 * 
 * This simulates what happens when invalid data is submitted
 * You can copy this into browser console or run with Node.js
 */

// Test the validation logic directly
function testPoolValidation(data) {
    const errors = [];
    
    // Name validation
    if (!data.name || data.name.trim().length === 0) {
        errors.push('Please enter your name');
    } else if (data.name.length > 100) {
        errors.push('Name must be 100 characters or less');
    }
    
    // Due date validation
    if (!data.dueDate) {
        errors.push('Please select a predicted birth date');
    } else {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(data.dueDate)) {
            errors.push('Birth date must be in YYYY-MM-DD format (e.g., 2026-02-15)');
        }
    }
    
    // Weight validation
    if (data.weight === undefined || data.weight === null) {
        errors.push('Please enter the predicted weight in kg');
    } else if (typeof data.weight !== 'number' || isNaN(data.weight)) {
        errors.push('Weight must be a number (e.g., 3.5)');
    } else if (data.weight < 1 || data.weight > 10) {
        errors.push(`Weight must be between 1 and 10 kg (you entered ${data.weight} kg)`);
    }
    
    // Length validation
    if (data.length === undefined || data.length === null) {
        errors.push('Please enter the predicted length in cm');
    } else if (typeof data.length !== 'number' || isNaN(data.length)) {
        errors.push('Length must be a number (e.g., 52)');
    } else if (data.length < 40 || data.length > 60) {
        errors.push(`Length must be between 40 and 60 cm (you entered ${data.length} cm)`);
    }
    
    return errors;
}

function testAdviceValidation(data) {
    const errors = [];
    
    // Advice text validation
    if (!data.advice || data.advice.trim().length === 0) {
        errors.push('Please enter your advice or message');
    } else if (data.advice.length < 5) {
        errors.push('Message must be at least 5 characters long');
    } else if (data.advice.length > 2000) {
        errors.push(`Message must be 2000 characters or less (yours is ${data.advice.length} characters)`);
    }
    
    // Category validation
    if (!data.category || data.category.trim().length === 0) {
        errors.push('Please select a delivery method (For Parents or For Baby)');
    } else {
        const normalizedCategory = data.category.toLowerCase().trim();
        const validCategories = ['general', 'naming', 'feeding', 'sleeping', 'safety', 'fun', 'ai_roast'];
        
        if (normalizedCategory === 'for parents' || normalizedCategory === 'parents') {
            // valid
        } else if (normalizedCategory === 'for baby' || normalizedCategory === 'baby') {
            // valid
        } else if (!validCategories.includes(normalizedCategory)) {
            errors.push('Invalid delivery method. Please choose "For Parents" or "For Baby"');
        }
    }
    
    return errors;
}

// Test cases
console.log('='.repeat(60));
console.log('🧪 VALIDATION FIX DEMONSTRATION');
console.log('='.repeat(60));

// Test 1: Valid Pool data
console.log('\n✅ TEST 1: Valid Baby Pool Data');
const validPool = {
    name: "Test User",
    prediction: "Date: 2026-02-15, Time: 08:30, Weight: 3.5kg, Length: 52cm",
    dueDate: "2026-02-15",
    weight: 3.5,
    length: 52
};
const poolErrors1 = testPoolValidation(validPool);
console.log(`   Data: ${JSON.stringify(validPool)}`);
console.log(`   Errors: ${poolErrors1.length === 0 ? 'None ✓' : poolErrors1.join(', ')}`);

// Test 2: Invalid weight (too high)
console.log('\n❌ TEST 2: Invalid Pool Data (weight too high)');
const invalidPool1 = { ...validPool, weight: 15 };
const poolErrors2 = testPoolValidation(invalidPool1);
console.log(`   Data: weight = 15 kg`);
console.log(`   Errors:`);
poolErrors2.forEach((error, i) => console.log(`      ${i + 1}. ${error}`));

// Test 3: Invalid length (too low)
console.log('\n❌ TEST 3: Invalid Pool Data (length too low)');
const invalidPool2 = { ...validPool, length: 35 };
const poolErrors3 = testPoolValidation(invalidPool2);
console.log(`   Data: length = 35 cm`);
console.log(`   Errors:`);
poolErrors3.forEach((error, i) => console.log(`      ${i + 1}. ${error}`));

// Test 4: Missing name
console.log('\n❌ TEST 4: Invalid Pool Data (missing name)');
const invalidPool3 = { ...validPool, name: "" };
const poolErrors4 = testPoolValidation(invalidPool3);
console.log(`   Data: name = ""`);
console.log(`   Errors:`);
poolErrors4.forEach((error, i) => console.log(`      ${i + 1}. ${error}`));

// Test 5: Valid Advice data
console.log('\n✅ TEST 5: Valid Advice Data');
const validAdvice = {
    name: "Test Advisor",
    category: "general",
    advice: "Trust your instincts! Every baby is different."
};
const adviceErrors1 = testAdviceValidation(validAdvice);
console.log(`   Data: ${JSON.stringify(validAdvice)}`);
console.log(`   Errors: ${adviceErrors1.length === 0 ? 'None ✓' : adviceErrors1.join(', ')}`);

// Test 6: Invalid category
console.log('\n❌ TEST 6: Invalid Advice Data (bad category)');
const invalidAdvice1 = { ...validAdvice, category: "invalid_category" };
const adviceErrors2 = testAdviceValidation(invalidAdvice1);
console.log(`   Data: category = "invalid_category"`);
console.log(`   Errors:`);
adviceErrors2.forEach((error, i) => console.log(`      ${i + 1}. ${error}`));

// Test 7: Empty message
console.log('\n❌ TEST 7: Invalid Advice Data (empty message)');
const invalidAdvice2 = { ...validAdvice, advice: "" };
const adviceErrors3 = testAdviceValidation(invalidAdvice2);
console.log(`   Data: advice = ""`);
console.log(`   Errors:`);
adviceErrors3.forEach((error, i) => console.log(`      ${i + 1}. ${error}`));

console.log('\n' + '='.repeat(60));
console.log('📝 SUMMARY: Validation now provides SPECIFIC error messages!');
console.log('   - Shows exactly which field failed');
console.log('   - Explains why it failed');
console.log('   - Shows the value that caused the failure');
console.log('   - Provides examples of correct format');
console.log('='.repeat(60));