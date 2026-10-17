import { readFileSync } from 'node:fs';
import {
  createSourceFile,
  forEachChild,
  isCallExpression,
  isIdentifier,
  ScriptTarget,
  type CallExpression,
  type Node,
} from 'typescript';
import { describe, expect, it } from 'vitest';
import { createSourcePolicy, isAllowedArticleSource } from '~/lib/source-policy';

const policy = createSourcePolicy(
  'https://example-game.com/',
  'https://www.reddit.com/r/ExampleGame/',
);

describe('article source policy', () => {
  it('passes both exact-page allowlists from site config into the content schema', () => {
    const url = new URL('../src/content.config.ts', import.meta.url);
    const text = readFileSync(url, 'utf8');
    const source = createSourceFile(url.pathname, text, ScriptTarget.Latest, true);
    const calls: CallExpression[] = [];

    const visit = (node: Node): void => {
      if (
        isCallExpression(node) &&
        isIdentifier(node.expression) &&
        node.expression.text === 'createSourcePolicy'
      ) {
        calls.push(node);
      }
      forEachChild(node, visit);
    };

    visit(source);
    expect(calls).toHaveLength(1);
    expect(calls[0].arguments.map((argument) => argument.getText(source))).toEqual([
      'site.social.official',
      'site.social.reddit',
      'site.trustedStorePages',
      'site.trustedMaterialPages',
    ]);
  });

  it('accepts configured store and material pages but not other pages on those hosts', () => {
    const configured = createSourcePolicy(
      'https://example-game.com/',
      undefined,
      ['https://store.example.org/game'],
      ['https://publisher.example.net/press/game'],
    );

    expect(isAllowedArticleSource('https://store.example.org/game', configured).allowed).toBe(true);
    expect(isAllowedArticleSource('https://publisher.example.net/press/game', configured).allowed).toBe(true);
    expect(isAllowedArticleSource('https://publisher.example.net/other', configured).allowed).toBe(false);
  });

  it('allows the configured official site and subpaths', () => {
    expect(isAllowedArticleSource('https://example-game.com/patch-notes', policy).allowed).toBe(true);
  });

  it('allows YouTube and both Steam surfaces', () => {
    for (const url of [
      'https://www.youtube.com/watch?v=abc',
      'https://youtu.be/abc',
      'https://store.steampowered.com/app/123',
      'https://steamcommunity.com/app/123/guides/',
    ]) expect(isAllowedArticleSource(url, policy).allowed).toBe(true);
  });

  it('allows only the configured Reddit subreddit', () => {
    expect(isAllowedArticleSource('https://www.reddit.com/r/ExampleGame/comments/abc/post', policy).allowed).toBe(true);
    expect(isAllowedArticleSource('https://www.reddit.com/r/OtherGame/comments/abc/post', policy).allowed).toBe(false);
    expect(isAllowedArticleSource('https://www.reddit.com/r/ExampleGame/comments/abc/post?url=https://competitor.example', policy).allowed).toBe(true);
  });

  it('rejects competitor sites, lookalike hosts, and non-http URLs', () => {
    for (const url of [
      'https://competitor.example/guide',
      'https://youtube.com.evil.example/watch?v=abc',
      'https://store.steampowered.com.evil.example/app/123',
      'javascript:alert(1)',
    ]) expect(isAllowedArticleSource(url, policy).allowed).toBe(false);
  });

  it('rejects Reddit when no relevant subreddit is configured', () => {
    const noReddit = createSourcePolicy('https://example-game.com');
    expect(isAllowedArticleSource('https://www.reddit.com/r/ExampleGame/', noReddit).allowed).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { createSourcePolicy, isAllowedArticleSource } from '../src/lib/source-policy';

describe('configured article source pages', () => {
  it('allows only exact approved material pages outside the built-in source hosts', () => {
    const policy = createSourcePolicy(
      'https://example-game.com/',
      undefined,
      [],
      ['https://wikily.gg/example-game/items/example-item'],
    );

    expect(isAllowedArticleSource('https://wikily.gg/example-game/items/example-item', policy).allowed).toBe(true);
    expect(isAllowedArticleSource('https://wikily.gg/example-game/items/another-item', policy).allowed).toBe(false);
  });

  it('allows exact configured store pages without opening the whole store domain', () => {
    const policy = createSourcePolicy('https://example-game.com/', undefined, ['https://store.example.com/game/demo']);

    expect(isAllowedArticleSource('https://store.example.com/game/demo', policy).allowed).toBe(true);
    expect(isAllowedArticleSource('https://store.example.com/game/other', policy).allowed).toBe(false);
  });
});
