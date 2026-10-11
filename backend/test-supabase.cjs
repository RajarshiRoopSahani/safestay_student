

require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function testConnection() {
  const { data, error } = await supabase.storage.listBuckets();

  console.log("Bucket error:", error);
  console.log("Bucket data:", data);

  if (error) {
    console.log("Error message:", error.message);
    return;
  }

  console.log("Supabase connected successfully!");
  console.log("Buckets:", data.map((bucket) => bucket.name));
}

testConnection();
