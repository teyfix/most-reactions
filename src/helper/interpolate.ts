const interpolate = (input: string, context: Record<string, string | number>): string => {
  if ('string' !== typeof input) {
    throw new Error('Interpolate input must be a string, given: ' + input);
  }

  if (null == context || 'object' !== typeof context) {
    throw new Error('Interpolate context must be an object');
  }

  return Object.entries(context).reduce(
    (prev, [key, value]) => {
      return prev.replace(
        new RegExp(`%${ key }`, 'g'),
        String(value ?? ''),
      );
    },
    input,
  );
};

export default interpolate;
