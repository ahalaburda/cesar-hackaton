const { App } = require('@slack/bolt');

describe('Banana Emoji + Mention Regex', () => {
  const regex = /(?=.*(?:🍌|:banana:))(?=.*<@[UW][A-Z0-9]+>)/;
  
  test('should match banana emoji before mention', () => {
    const text = '🍌 Hey <@U1234567890> check this out!';
    expect(regex.test(text)).toBe(true);
  });

  test('should match banana emoji after mention', () => {
    const text = 'Hey <@U1234567890> 🍌 banana time!';
    expect(regex.test(text)).toBe(true);
  });

  test('should match :banana: text before mention', () => {
    const text = ':banana: <@U1234567890> loves bananas';
    expect(regex.test(text)).toBe(true);
  });

  test('should match :banana: text after mention', () => {
    const text = '<@U1234567890> :banana: party!';
    expect(regex.test(text)).toBe(true);
  });

  test('should not match without banana', () => {
    const text = 'Hey <@U1234567890> how are you?';
    expect(regex.test(text)).toBe(false);
  });

  test('should not match without mention', () => {
    const text = '🍌 I love bananas!';
    expect(regex.test(text)).toBe(false);
  });

  test('should match with both emoji and text', () => {
    const text = '🍌 <@U1234567890> :banana: double banana!';
    expect(regex.test(text)).toBe(true);
  });
});