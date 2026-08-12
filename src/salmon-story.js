// 곰 애니메이션은 정확히 20프레임이며 각 프레임을 0.2초 동안 보여줍니다.
export const SALMON_FRAME_DURATION=200;

export const salmonStoryFrames=Array.from({length:20},(_,index)=>({
  src:`/salmon-story/frame-${String(index+1).padStart(2,'0')}.png`,
  action:index<5?'walk':index<8?'reach':index<10?'grab':index<16?'eat':'return'
}));

export const SALMON_STORY_DURATION=salmonStoryFrames.length*SALMON_FRAME_DURATION;
