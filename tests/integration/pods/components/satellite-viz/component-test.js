import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('satellite-viz', 'Integration | Component | satellite viz', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{satellite-viz}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#satellite-viz}}
      template block text
    {{/satellite-viz}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
