import ObjectMatcher from '@server/objectMatcher';

describe('Object Matcher', () => {
  it('can determine if response object matches the pattern - simple object', () => {
    const responseObj: object = {
      status: 'Healthy',
    };
    const pattern: {[key: string]: any} = {
      status: 'Healthy',
    };
    expect(ObjectMatcher(responseObj, pattern)).toBe(true);

    pattern['status'] = 'not healthy!';
    expect(ObjectMatcher(responseObj, pattern)).toBe(false);
  });

  it('returns true if pattern is null or undefined', () => {
    const responseObj: object = {
      status: {
        someOtherProp: 'Healthy',
      },
      time: '13:00:00',
    };
    let pattern = null;
    expect(ObjectMatcher(responseObj, pattern)).toBe(true);
  });

  it('can determine if response object matches the pattern - 1 level nested object', () => {
    const responseObj: object = {
      status: {
        someOtherProp: 'Healthy',
      },
      time: '13:00:00',
    };
    let pattern: {[key: string]: any} = {
      status: {
        someOtherProp: 'Healthy',
      },
    };
    expect(ObjectMatcher(responseObj, pattern)).toBe(true);

    pattern['status'] = 'a string';
    expect(ObjectMatcher(responseObj, pattern)).toBe(false);
  });

  it('can determine if response object matches the pattern - 2 levels nested object', () => {
    const responseObj: object = {
      status: {
        someOtherProp: 'Healthy',
        extraone: {
          st: 1234,
        },
      },
      time: '13:00:00',
    };
    let pattern: {[key: string]: any} = {
      status: {
        extraone: {
          st: 1234,
        },
      },
    };
    expect(ObjectMatcher(responseObj, pattern)).toBe(true);

    pattern['status']['extraone']['st'] = 'another value';
    expect(ObjectMatcher(responseObj, pattern)).toBe(false);
  });

  it('can determine if response object matches the pattern - 2 levels nested object and multiple matches required', () => {
    const responseObj: object = {
      status: {
        someOtherProp: 'Healthy',
        extraone: {
          st: 1234,
        },
      },
      time: '13:00:00',
      anotherProp: {
        one: {
          two: 34,
        },
      },
    };
    let pattern: {[key: string]: any} = {
      status: {
        extraone: {
          st: 1234,
        },
      },
      anotherProp: {
        one: {
          two: 34,
        },
      },
    };
    expect(ObjectMatcher(responseObj, pattern)).toBe(true);

    pattern['anotherProp']['one']['two'] = 'another value';
    expect(ObjectMatcher(responseObj, pattern)).toBe(false);
  });
});
