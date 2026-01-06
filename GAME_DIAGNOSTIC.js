// Paste this ENTIRE block into the browser console (F12 → Console) on https://baby-shower-v2.vercel.app

(function() {
    console.clear();
    console.log('%c🔍 MOM VS DAD GAME DIAGNOSTIC', 'font-size: 20px; font-weight: bold; color: #2196F3;');
    console.log('%c=====================================', 'color: #666;');
    
    // Step 1: Check if we can see the section
    console.log('\n📋 STEP 1: Checking HTML elements...');
    const section = document.getElementById('mom-vs-dad-section');
    const container = document.getElementById('mom-vs-dad-game');
    
    console.log(`   Section: ${section ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   Container: ${container ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (!section || !container) {
        console.log('\n❌ ERROR: HTML elements are missing from index.html!');
        console.log('   This is a bug - the section and container should exist.');
        return;
    }
    
    // Step 2: Check if section is visible
    console.log('\n📋 STEP 2: Checking visibility...');
    const isHidden = section.classList.contains('hidden');
    const isActive = section.classList.contains('active');
    console.log(`   Has 'hidden' class: ${isHidden ? 'YES ❌' : 'NO ✅'}`);
    console.log(`   Has 'active' class: ${isActive ? 'YES ✅' : 'NO ❌'}`);
    
    // Step 3: Check if game has content
    console.log('\n📋 STEP 3: Checking game content...');
    const lobbySelector = section.querySelector('#mom-vs-dad-lobbies');
    const lobbyCards = section.querySelectorAll('.lobby-card');
    const innerHTML = container.innerHTML.trim();
    
    console.log(`   Lobby selector div: ${lobbySelector ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   Lobby cards: ${lobbyCards.length} found`);
    console.log(`   Container HTML length: ${innerHTML.length} characters`);
    
    if (innerHTML.length > 0) {
        console.log('\n✅ Container has content! First 100 chars:');
        console.log(`   ${innerHTML.substring(0, 100)}...`);
    } else {
        console.log('\n❌ Container is EMPTY - no game content rendered!');
    }
    
    // Step 4: Try to render manually
    console.log('\n📋 STEP 4: Attempting manual render...');
    try {
        console.log('   Calling window.MomVsDadSimplified.init()...');
        window.MomVsDadSimplified.init();
        
        // Wait and check
        setTimeout(() => {
            const newHTML = container.innerHTML.trim();
            console.log(`   After init(), HTML length: ${newHTML.length} characters`);
            
            const newCards = container.querySelectorAll('.lobby-card');
            console.log(`   Lobby cards now: ${newCards.length}`);
            
            if (newCards.length > 0) {
                console.log('\n🎉 SUCCESS! Game rendered after manual init()!');
                console.log('✅ The game code is working!');
                console.log('✅ The issue might have been the initial render timing.');
            } else if (newHTML.length > 0) {
                console.log('\n⚠️ PARTIAL: Container has content but no lobby cards.');
                console.log('   This suggests renderLobbySelector() ran but lobby cards failed.');
            } else {
                console.log('\n❌ FAILED: Still no content after init()');
                console.log('   This suggests an error in renderLobbySelector()');
                
                // Check for errors
                const mvdSection = container.querySelector('.mvd-section');
                if (mvdSection) {
                    console.log('   Error section found:');
                    console.log('   ' + mvdSection.innerText.substring(0, 100));
                }
            }
            
            console.log('\n=====================================');
            console.log('📊 SUMMARY:');
            console.log('=====================================');
            console.log(`HTML Elements: ${section && container ? '✅ Present' : '❌ Missing'}`);
            console.log(`Visibility: ${!isHidden ? '✅ Visible' : '❌ Hidden'}`);
            console.log(`Lobby Cards: ${newCards.length > 0 ? '✅ ' + newCards.length + ' cards' : '❌ None'}`);
            console.log('\nIf you see ❌ for Lobby Cards, the game is not rendering!');
            
        }, 200);
        
    } catch (error) {
        console.log(`\n❌ ERROR during init(): ${error.message}`);
        console.log(error.stack);
    }
    
})();
