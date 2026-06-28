const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ═══ CHEILE TALE DE LA SUPABASE ═══
const supabaseUrl = 'https://mdpttarozsehwmrygvot.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kcHR0YXJvenNlaHdtcnlndm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0Njg5MDQsImV4cCI6MjA5ODA0NDkwNH0.7s1ieguV7eApftrkQjMF9rqgVYsxjyY4W-ASBeaKF9Y';
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── GET ───
app.get('/api/notes/:id', async (req, res) => {
  const id = req.params.id;
  const { data, error } = await supabase
    .from('notes')
    .select('content')
    .eq('id', id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json({ content: data.content });
});

// ─── POST ───
app.post('/api/notes/:id', async (req, res) => {
  const id = req.params.id;
  const { content } = req.body;
  if (content === undefined) return res.status(400).json({ error: 'Content missing' });

  const { error } = await supabase
    .from('notes')
    .upsert({ id: id, content: content });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🚀 Serverul (cu Supabase) rulează pe portul ${PORT}`);
});