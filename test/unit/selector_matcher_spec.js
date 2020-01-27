import * as selectorMatcherModule from '/lib/scan/selector_matcher.js';


describe('selector_matcher', function() {
  describe('match', function() {
    it('matches index', async function() {
      const expectedMatch = '<div class="name">content</div>';
      const html = `<main><img class="img"><div class="name">content</div>
${expectedMatch}<div class="name" id="tag">tag</div></main>`;
      const match = await selectorMatcherModule.matchHtmlWithSelector(
        html,
        '.name:nth-child(2)',
      );
      expect(match).toEqual([expectedMatch]);
    });

    it('matches class', async function() {
      const firstMatch = '<div class="name">content</div>';
      const secondMatch = '<div class="name">content</div>';
      const thirdMatch = '<div class="name" id="tag">tag</div>';
      const html = `<main><img class="img">${firstMatch}${secondMatch}</main>
${thirdMatch}`;
      const result = await selectorMatcherModule.matchHtmlWithSelector(
        html,
        '.name',
      );

      expect(result).toEqual([firstMatch, secondMatch, thirdMatch]);
    });

    it('matches id', async function() {
      const match = '<div class="name" id="tag">tag</div>';
      const html = `<main><img class="img"><div class="name">content</div>
<div class="name">content</div>${match}</main>`;
      const result = await selectorMatcherModule.matchHtmlWithSelector(
        html,
        '#tag',
      );

      expect(result).toEqual([match]);
    });

    it('matches nothing', async function() {
      const match = '<div class="name" id="tag">tag</div>';
      const html = `<main><img class="img"><div class="name">content</div>
<div class="name">content</div>${match}</main>`;
      const result = await selectorMatcherModule.matchHtmlWithSelector(
        html,
        '#tag .class',
      );

      expect(result).toEqual([]);
    });

    it('matches invalid', async function() {
      const match = '<div class="name" id="tag">tag</div>';
      const html = `<main><img class="img"><div class="name">content</div>
<div class="name">content</div>${match}</main>`;
      const result = await selectorMatcherModule.matchHtmlWithSelector(
        html,
        '#tag .class:nth-child(42)',
      );

      expect(result).toEqual([]);
    });

    it('unpaired tag match', async function() {
      const match = '<img class="img" src="#" alt="whatever">';
      const html = `<main class="wrap">${match}</main>`;
      const result = await selectorMatcherModule.matchHtmlWithSelector(
        html,
        '.img',
      );

      expect(result).toEqual([match]);
    });

    it('match nested', async function() {
      const decoy = '<div class="wrap target" id="theuniverse">MISS!</div>';
      const match = '<div class="wrap target" id="theuniverse">HIT!</div>';
      const html = `
<main class="wrap">
  <img class="img">
  ${decoy}
  ${decoy}
  <span id="theuniverse">
    ${decoy}
    ${match}
    ${decoy}
    ${decoy}
  </span>
</main>`;
      const result = await selectorMatcherModule.matchHtmlWithSelector(
        html,
        '.wrap #theuniverse #theuniverse:nth-child(2)',
      );

      expect(result).toEqual([match]);
    });
  });
});
