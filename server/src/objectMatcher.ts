type GenericObject = {[key: string]: any};

const ObjectMatcher = (
  response: GenericObject,
  pattern?: GenericObject,
): boolean => {
  let match: boolean = true;
  if (!pattern) return match;
  for (let [key, value] of Object.entries(pattern)) {
    if (typeof value === 'object') {
      match = match && ObjectMatcher(response[key], value);
    } else if (response[key] != value) {
      return false;
    }
  }
  return match;
};

export default ObjectMatcher;
