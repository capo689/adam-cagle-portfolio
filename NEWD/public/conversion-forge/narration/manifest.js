window.WORKFLOW_NARRATION = {
  model: 'fish-audio/s2.1-pro-free:free',
  voice: 'ACE',
  format: 'mp3',
  rate: 1,
  postRoll: 0.25,
  intro: {id:'intro',src:'/conversion-forge/narration/audio/00-intro.mp3',duration:33.705},
  segments: [
    {id:'brief',src:'/conversion-forge/narration/audio/01-brief.mp3',duration:12.818},
    {id:'normalize',src:'/conversion-forge/narration/audio/02-normalize.mp3',duration:7.663},
    {id:'brand',src:'/conversion-forge/narration/audio/03-brand.mp3',duration:13.096},
    {id:'router',src:'/conversion-forge/narration/audio/04-router.mp3',duration:10.682},
    {id:'lanes',src:'/conversion-forge/narration/audio/05-lanes.mp3',duration:11.285},
    {id:'dedupe',src:'/conversion-forge/narration/audio/06-dedupe.mp3',duration:10.124},
    {id:'policy',src:'/conversion-forge/narration/audio/07-policy.mp3',duration:11.842},
    {id:'compliance',src:'/conversion-forge/narration/audio/08-compliance.mp3',duration:9.567},
    {id:'discard',src:'/conversion-forge/narration/audio/09-discard.mp3',duration:10.728},
    {id:'voice',src:'/conversion-forge/narration/audio/10-voice.mp3',duration:11.564},
    {id:'rank',src:'/conversion-forge/narration/audio/11-rank.mp3',duration:8.081},
    {id:'human',src:'/conversion-forge/narration/audio/12-human.mp3',duration:12.771},
    {id:'deploy',src:'/conversion-forge/narration/audio/13-deploy.mp3',duration:9.706},
    {id:'sequential',src:'/conversion-forge/narration/audio/14-sequential.mp3',duration:12.910},
    {id:'guardrail',src:'/conversion-forge/narration/audio/15-guardrail.mp3',duration:7.709},
    {id:'result',src:'/conversion-forge/narration/audio/16-result.mp3',duration:11.656},
    {id:'patterns',src:'/conversion-forge/narration/audio/17-patterns.mp3',duration:12.122},
    {id:'priors',src:'/conversion-forge/narration/audio/18-priors.mp3',duration:14.768}
  ]
};
