-- Neon Postgres migration for the optional Popular feature.
CREATE TABLE IF NOT EXISTS article_views_daily (
  slug TEXT NOT NULL,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  view_count BIGINT NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  PRIMARY KEY (slug, view_date)
);

CREATE INDEX IF NOT EXISTS idx_article_views_daily_view_date
  ON article_views_daily(view_date);
