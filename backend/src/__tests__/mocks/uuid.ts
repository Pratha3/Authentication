let counter = 0;
export const v4 = () => `mock-uuid-${++counter}-${Math.random().toString(36).substring(2)}`;
export default { v4 };
