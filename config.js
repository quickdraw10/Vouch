// Vouch connection settings.
// The publishable (anon) key is designed to be public: the database's privacy rules protect the data.
// Never put the secret / service_role key in this file.
window.VOUCH_CONFIG = {
  supabaseUrl: 'YOUR_SUPABASE_PROJECT_URL',
  supabaseKey: 'YOUR_SUPABASE_PUBLISHABLE_KEY'
};
