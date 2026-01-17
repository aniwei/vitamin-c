import invariant from 'invariant'

export function nearEqual (
  a: number | null = null, 
  b: number | null = null, 
  epsilon: number
): boolean {
  invariant(epsilon >= 0.0, 'epsilon must be a non-negative number')
  if (a === null || b === null) {
    return a === b
  }
  return (
    (a > (b - epsilon)) && 
    (a < (b + epsilon)) || 
    a === b
  )
}