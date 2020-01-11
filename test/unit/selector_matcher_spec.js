import * as scanContentModule from '/lib/scan/selector_matcher.js';


describe('selector_matcher', function() {
  describe('match', function() {
    it('matches index', async function() {
      const expectedMatch = '<div class="name">content</div>';
      const html = `<main><img class="img"><div class="name">content</div>
${expectedMatch}<div class="name" id="tag">tag</div></main>`;
      const match = await scanContentModule.__.matchHtmlWithSelector(
        html,
        '.name[1]',
      );
      expect(match).toEqual([expectedMatch]);
    });

    it('matches class', async function() {
      const firstMatch = '<div class="name">content</div>';
      const secondMatch = '<div class="name">content</div>';
      const thirdMatch = '<div class="name" id="tag">tag</div>';
      const html = `<main><img class="img">${firstMatch}${secondMatch}</main>
${thirdMatch}`;
      const result = await scanContentModule.__.matchHtmlWithSelector(
        html,
        '.name',
      );

      expect(result).toEqual([firstMatch, secondMatch, thirdMatch]);
    });

    it('matches id', async function() {
      const match = '<div class="name" id="tag">tag</div>';
      const html = `<main><img class="img"><div class="name">content</div>
<div class="name">content</div>${match}</main>`;
      const result = await scanContentModule.__.matchHtmlWithSelector(
        html,
        '#tag',
      );

      expect(result).toEqual([match]);
    });

    it('matches nothing', async function() {
      const match = '<div class="name" id="tag">tag</div>';
      const html = `<main><img class="img"><div class="name">content</div>
<div class="name">content</div>${match}</main>`;
      const result = await scanContentModule.__.matchHtmlWithSelector(
        html,
        '#tag.class',
      );

      expect(result).toEqual([]);
    });

    it('matches invalid', async function() {
      const match = '<div class="name" id="tag">tag</div>';
      const html = `<main><img class="img"><div class="name">content</div>
<div class="name">content</div>${match}</main>`;
      const result = await scanContentModule.__.matchHtmlWithSelector(
        html,
        '#tag.class[42]',
      );

      expect(result).toEqual([]);
    });

    it('match nested', async function() {
      const decoy = '<div class=" __confuse target me ">MISS!</div>';
      const match = '<div class=" __confuse target me ">HIT!</div>';
      const html = `
<main class="wrap">
  <img class="img" src="#">
  ${decoy}
  ${decoy}
  <span id="theuniverse">
    ${decoy}
    ${match}
    ${decoy}
    ${decoy}
  </span>
</main>`;
      const result = await scanContentModule.__.matchHtmlWithSelector(
        html,
        '.wrap#theuniverse.target[1]',
      );

      expect(result).toEqual([match]);
    });

    /* it('future improvements nested test', async function() {
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
      const result = await scanContentModule.__.matchHtmlWithSelector(
        html,
        '.wrap#theuniverse[1]',
      );

      expect(result).toEqual([match]);
    });*/
  });
});
