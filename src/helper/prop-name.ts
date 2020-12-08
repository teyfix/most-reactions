const propName = (prop: number | string | symbol): string => {
  return 'string' === typeof prop ? '.' + prop : '[' + prop.toString() + ']';
};

export default propName;
