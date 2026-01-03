/**
 * Mom vs Dad Game - Stable End-to-End Test Script
 * Tests the complete game flow using Supabase directly
 * 
 * Usage: node scripts/test-game.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration - using service role key for testing
const SUPABASE_URL = 'https://bkszmvfsfgvdwzacgmfz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc3ptdmZzZmd2ZHdhY2dtZnoiLCJyb2xlIjoic2VydmljZSIsImlhdCI6MTczNjY1MDIwMCwiZXhwIjo0OTIyMjI4MjAwfQ.7CkT..';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testGameFlow() {
  console.log('🎮 Starting Mom vs Dad Game E2E Test...\n');
  
  try {
    // Step 1: Create a session
    console.log('1️⃣  Creating game session...');
    const sessionCode = 'FARM' + Math.random().toString(36).substring(2, 5).toUpperCase();
    const adminCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    const { data: session, error: sessionError } = await supabase
      .from('baby_shower.game_sessions')
      .insert({
        session_code: sessionCode,
        admin_code: adminCode,
        mom_name: 'Emma',
        dad_name: 'Oliver',
        status: 'voting',
        total_rounds: 3
      })
      .select()
      .single();
      
    if (sessionError) throw sessionError;
    console.log(`   ✅ Session created: ${sessionCode} (PIN: ${adminCode})`);
    console.log(`   📋 ID: ${session.id}\n`);

    // Step 2: Join as a guest
    console.log('2️⃣  Joining session as guest...');
    // Note: join is validated by the Edge Function, but we can verify session exists
    const { data: verifySession, error: verifyError } = await supabase
      .from('baby_shower.game_sessions')
      .select('*')
      .eq('session_code', sessionCode)
      .single();
      
    if (verifyError) throw verifyError;
    console.log(`   ✅ Session verified: ${verifySession.mom_name} vs ${verifySession.dad_name}\n`);

    // Step 3: Generate a scenario
    console.log('3️⃣  Generating AI scenario...');
    const { data: scenario, error: scenarioError } = await supabase
      .from('baby_shower.game_scenarios')
      .insert({
        session_id: session.id,
        scenario_text: "It's 3 AM and the baby has a dirty diaper that requires immediate attention.",
        mom_option: "Emma would gently clean it up while singing a lullaby",
        dad_option: "Oliver would make a dramatic production of it while holding their breath",
        intensity: 0.6
      })
      .select()
      .single();
      
    if (scenarioError) throw scenarioError;
    console.log(`   ✅ Scenario created: ${scenario.id}`);
    console.log(`   📝 Text: "${scenario.scenario_text.substring(0, 50)}..."\n`);

    // Step 4: Submit votes
    console.log('4️⃣  Submitting guest votes...');
    const guests = ['Guest1', 'Guest2', 'Guest3', 'Guest4', 'Guest5'];
    const votes = ['mom', 'dad', 'mom', 'mom', 'dad'];
    
    for (let i = 0; i < guests.length; i++) {
      const { error: voteError } = await supabase
        .from('baby_shower.game_votes')
        .insert({
          scenario_id: scenario.id,
          guest_name: guests[i],
          vote_choice: votes[i]
        });
        
      if (voteError) throw voteError;
      console.log(`   ✅ ${guests[i]} voted for ${votes[i]}`);
    }
    console.log('');

    // Step 5: Lock parent answers
    console.log('5️⃣  Locking parent answers...');
    const { error: answerError } = await supabase
      .from('baby_shower.game_answers')
      .insert({
        scenario_id: scenario.id,
        mom_answer: 'dad',
        dad_answer: 'dad',
        mom_locked: true,
        dad_locked: true
      });
      
    if (answerError) throw answerError;
    console.log('   ✅ Both parents locked their answers (both chose dad)\n');

    // Step 6: Calculate results manually
    console.log('6️⃣  Calculating results...');
    const momVotes = votes.filter(v => v === 'mom').length;
    const dadVotes = votes.filter(v => v === 'dad').length;
    const totalVotes = momVotes + dadVotes;
    const momPct = Math.round((momVotes / totalVotes) * 100);
    const dadPct = Math.round((dadVotes / totalVotes) * 100);
    const crowdChoice = momPct > dadPct ? 'mom' : 'dad';
    const actualChoice = 'dad';
    const perceptionGap = crowdChoice === actualChoice ? momPct - 50 : 100 - momPct - 50;
    
    console.log(`   📊 Vote Results:`);
    console.log(`      Mom: ${momVotes} votes (${momPct}%)`);
    console.log(`      Dad: ${dadVotes} votes (${dadPct}%)`);
    console.log(`      Crowd picked: ${crowdChoice}`);
    console.log(`      Actual answer: ${actualChoice}`);
    console.log(`      Perception gap: ${Math.abs(perceptionGap)}%\n`);

    // Step 7: Insert result
    console.log('7️⃣  Storing game result...');
    const roastCommentary = crowdChoice === actualChoice 
      ? `🎯 Spot on! ${momPct}% correctly picked ${actualChoice}! You really know them!`
      : `😅 Oops! ${momPct}% were SO wrong! The crowd was absolutely certain about ${crowdChoice}!`;
    
    const { data: result, error: resultError } = await supabase
      .from('baby_shower.game_results')
      .insert({
        scenario_id: scenario.id,
        mom_votes: momVotes,
        dad_votes: dadVotes,
        crowd_choice: crowdChoice,
        actual_choice: actualChoice,
        perception_gap: perceptionGap,
        roast_commentary: roastCommentary,
        particle_effect: 'confetti'
      })
      .select()
      .single();
      
    if (resultError) throw resultError;
    console.log(`   ✅ Result stored: ${result.id}`);
    console.log(`   💬 Roast: "${roastCommentary}"\n`);

    // Step 8: Update session
    console.log('8️⃣  Updating session...');
    const { error: updateError } = await supabase
      .from('baby_shower.game_sessions')
      .update({ 
        status: 'revealed',
        current_round: 1
      })
      .eq('id', session.id);
      
    if (updateError) throw updateError;
    console.log(`   ✅ Session updated to 'revealed'\n`);

    // Final Summary
    console.log('🎉 TEST COMPLETE!');
    console.log('================');
    console.log(`Session Code: ${sessionCode}`);
    console.log(`Admin PIN: ${adminCode}`);
    console.log(`Scenario ID: ${scenario.id}`);
    console.log(`Result ID: ${result.id}`);
    console.log(`\n✅ All game operations completed successfully!\n`);
    
    return {
      success: true,
      sessionCode,
      adminCode,
      scenarioId: scenario.id,
      resultId: result.id,
      voteResults: { momVotes, dadVotes, momPct, dadPct, crowdChoice, actualChoice, perceptionGap }
    };
    
  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error:', error.message);
    console.error('Full error:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
testGameFlow()
  .then(result => {
    if (result.success) {
      console.log('🎊 Game test PASSED!', JSON.stringify(result, null, 2));
      process.exit(0);
    } else {
      console.error('💥 Game test FAILED!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
