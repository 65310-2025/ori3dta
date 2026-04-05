export type Quaternion = [number, number, number, number]; // [w, x, y, z]

export const multiplyQuaternions = (
  q1: Quaternion,
  q2: Quaternion,
): Quaternion => {
  const [w1, x1, y1, z1] = q1;
  const [w2, x2, y2, z2] = q2;

  return [
    w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
    w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
    w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2,
    w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2,
  ];
};

export const isIdentityRotation = (
  q: Quaternion,
  tolerance: number = 1e-4,
): boolean => {
  const [w, x, y, z] = q;
  // It is the identity rotation if w is close to 1 or -1, and x, y, z are close to 0.
  // We check if the real part magnitude is close to 1.
  return (
    Math.abs(Math.abs(w) - 1) < tolerance &&
    Math.abs(x) < tolerance &&
    Math.abs(y) < tolerance &&
    Math.abs(z) < tolerance
  );
};
