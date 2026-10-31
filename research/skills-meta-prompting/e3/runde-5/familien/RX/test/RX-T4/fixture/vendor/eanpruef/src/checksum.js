// GS1 check digit: weights 3 and 1 from the right, excluding the check digit.
export function checkDigit(body) {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const w = (body.length - i) % 2 === 1 ? 3 : 1;
    sum += Number(body[i]) * w;
  }
  return (10 - (sum % 10)) % 10;
}
