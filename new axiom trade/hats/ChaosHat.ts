export class ChaosHat {
  name = 'Chaos Hat'
  deliberate(topic, input) {
    const roll = Math.random()
    return roll > 0.5
      ? `🌀 Chaos: Approve. What could possibly go wrong?`
      : `🌀 Chaos: Add a test failure just to be sure.`
  }
}