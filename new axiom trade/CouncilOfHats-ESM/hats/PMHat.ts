export class PMHat {
  name = 'PM Hat'
  deliberate(topic, input) {
    return `🧢 PM: Next step is ${input.next} after ${input.dependencies.join(', ')}`
  }
}