// Quick diagnostic - paste this in browser console (F12) on the Baby Shower page:

(function() {
    console.log('🔍 QUICK DIAGNOSTIC');
    console.log('==================');
    
    // Check 1: Script loaded
    const scriptLoaded = typeof window.MomVsDadSimplified !== 'undefined';
    console.log(`1. Script loaded: ${scriptLoaded ? '✅ YES' : '❌ NO'}`);
    
    if (!scriptLoaded) {
        console.log('❌ Script is not loaded at all!');
        return;
    }
    
    // Check 2: Section exists in HTML
    const section = document.getElementById('mom-vs-dad-section');
    console.log(`2. Section #mom-vs-dad-section: ${section ? '✅ EXISTS' : '❌ MISSING'}`);
    
    // Check 3: Game container exists
    const container = document.getElementById('mom-vs-dad-game');
    console.log(`3. Container #mom-vs-dad-game: ${container ? '✅ EXISTS' : '❌ MISSING'}`);
    
    // Check 4: Section is visible
    if (section) {
        const isHidden = section.classList.contains('hidden');
        console.log(`4. Section visible: ${!isHidden ? '✅ YES' : '❌ No (has hidden class)'}`);
    }
    
    // Check 5: Try to initialize manually
    console.log('5. Attempting manual initialization...');
    try {
        if (container) {
            // Clear any existing content
            container.innerHTML = '';
            
            // Call init
            window.MomVsDadSimplified.init();
            
            // Check if content was added
            setTimeout(() => {
                const content = container.innerHTML;
                console.log(`6. After init(), container has content: ${content.length > 0 ? '✅ YES' : '❌ NO'}`);
                
                if (content.length > 0) {
                    const lobbyCards = container.querySelectorAll('.lobby-card');
                    console.log(`7. Lobby cards found: ${lobbyCards.length}`);
                    console.log('🎉 GAME IS WORKING!');
                } else {
                    console.log('❌ Init ran but no content was added');
                    console.log('Checking for errors...');
                }
                
                // Check for mvd-section
                const mvdSection = container.querySelector('.mvd-section');
                console.log(`8. mvd-section rendered: ${mvdSection ? '✅ YES' : '❌ NO'}`);
                
            }, 100);
        } else {
            console.log('❌ Cannot init - container does not exist');
            console.log('This means the HTML element is missing from index.html');
        }
    } catch (error) {
        console.log(`❌ Error during init: ${error.message}`);
        console.log(error.stack);
    }
    
    console.log('==================');
    console.log('If you see ❌ for section or container, the HTML elements are missing!');
})();
