const { createClient } = require("@supabase/supabase-js");

(async () => {
    const supabase = createClient(
        "https://bkszmvfsfgvdwzacgmfz.supabase.co",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log("🧪 Testing guestbook...\n");

    const { data, error } = await supabase.functions.invoke("guestbook", { 
        body: { 
            name: "Test User", 
            relationship: "Friend", 
            message: "Testing guestbook" 
        }
    });

    if (error) {
        console.log("❌ Error:", error.message);
        console.log("Full:", JSON.stringify(error, null, 2));
    } else {
        console.log("✅ Success:", data);
    }
})();
