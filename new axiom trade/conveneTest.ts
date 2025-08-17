import { conveneCouncil } from './council/index.ts';

async function runTest() {
  const result = await conveneCouncil('next-step', {
    next: 'T2.3 – PMACChain Builder',
    dependencies: ['T1.10', 'snapshot']
  });

  console.log('\n📋 Council Deliberation Result:');
  console.log(result);
}

runTest();