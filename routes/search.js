router.get('/search', async (req, res) => {
  const { sector, keyword } = req.query;

  const query = {};
  if (sector) query.sector = sector;
  if (keyword) query.description = { $regex: keyword, $options: 'i' };

  const ideas = await Idea.find(query).sort({ datePosted: -1 });

  res.render('search', { ideas });
});
