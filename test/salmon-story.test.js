import {describe,expect,it} from 'vitest';
import {SALMON_FRAME_DURATION,SALMON_STORY_DURATION,salmonStoryFrames} from '../src/salmon-story.js';

describe('곰 연어 스토리 애니메이션',()=>{
  it('0.2초 간격의 정확한 20프레임으로 구성된다',()=>{
    expect(SALMON_FRAME_DURATION).toBe(200);
    expect(salmonStoryFrames).toHaveLength(20);
    expect(SALMON_STORY_DURATION).toBe(4000);
  });

  it('연어를 잡고 먹은 뒤 오른쪽으로 퇴장한다',()=>{
    expect(salmonStoryFrames.some(frame=>frame.action==='grab')).toBe(true);
    expect(salmonStoryFrames.some(frame=>frame.action==='eat')).toBe(true);
    expect(salmonStoryFrames.at(-1).action).toBe('return');
  });
});
