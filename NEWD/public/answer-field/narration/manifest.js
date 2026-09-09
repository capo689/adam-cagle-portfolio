window.WORKFLOW_NARRATION = {
  model: 'fish-audio/s2.1-pro-free:free',
  voice: 'ACE',
  format: 'mp3',
  rate: 1,
  postRoll: 0.25,
  intro: {id:'intro',src:'/answer-field/narration/audio/00-intro.mp3',duration:35.656},
  segments: [
    {id:'queries',src:'/answer-field/narration/audio/01-queries.mp3',duration:13.050},
    {id:'privacy',src:'/answer-field/narration/audio/02-privacy.mp3',duration:7.802},
    {id:'cluster',src:'/answer-field/narration/audio/03-cluster.mp3',duration:14.211},
    {id:'freeze',src:'/answer-field/narration/audio/04-freeze.mp3',duration:11.471},
    {id:'router',src:'/answer-field/narration/audio/05-router.mp3',duration:10.588},
    {id:'schedule',src:'/answer-field/narration/audio/06-schedule.mp3',duration:10.495},
    {id:'engines',src:'/answer-field/narration/audio/07-engines.mp3',duration:9.149},
    {id:'extract',src:'/answer-field/narration/audio/08-extract.mp3',duration:12.122},
    {id:'judges',src:'/answer-field/narration/audio/09-judges.mp3',duration:13.328},
    {id:'variance',src:'/answer-field/narration/audio/10-variance.mp3',duration:13.143},
    {id:'canonical',src:'/answer-field/narration/audio/11-canonical.mp3',duration:5.480},
    {id:'graph',src:'/answer-field/narration/audio/12-graph.mp3',duration:11.471},
    {id:'diagnose',src:'/answer-field/narration/audio/13-diagnose.mp3',duration:11.053},
    {id:'score',src:'/answer-field/narration/audio/14-score.mp3',duration:11.517},
    {id:'readonly',src:'/answer-field/narration/audio/15-readonly.mp3',duration:9.288},
    {id:'handoff',src:'/answer-field/narration/audio/16-handoff.mp3',duration:9.520},
    {id:'narrative',src:'/answer-field/narration/audio/17-narrative.mp3',duration:17.043}
  ]
};
