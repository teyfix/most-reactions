const escapeRegExp = (pattern: string): string => {
  return pattern.replace(/[\[\](){}\\/*+-]/g, m => '\\' + m);
};

export default escapeRegExp;
