const ellipsis = (input: string, max = 50, suf = '...'): string => {
  if (suf.length > max) {
    throw new Error('Suffix must be shorter than max length');
  }

  return input.length > max ? input.substring(0, max - suf.length) + suf : input;
};

export default ellipsis;
