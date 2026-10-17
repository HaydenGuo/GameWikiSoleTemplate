-- Cloudflare D1 / SQLite migration for the optional Popular feature.
CREATE TABLE IF NOT EXISTS article_views_daily (
  slug TEXT NOT NULL,
  view_date TEXT NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (slug, view_date)
);

CREATE INDEX IF NOT EXISTS idx_article_views_daily_view_date
  ON article_views_daily(view_date);
