import {describe,expect,it} from 'vitest';
import {WATER_BUTTON_DEFAULTS,normalizeWaterButtonOptions} from '../src/water-button.js';

describe('Water Button 옵션',()=>{
  it('요구된 기본 문구와 물 높이를 제공한다',()=>{
    expect(WATER_BUTTON_DEFAULTS.label).toBe('WATER BUTTON');
    expect(WATER_BUTTON_DEFAULTS.waterLevel).toBeGreaterThanOrEqual(.65);
    expect(WATER_BUTTON_DEFAULTS.waterLevel).toBeLessThanOrEqual(.7);
  });

  it('커스터마이징 값을 정규화하고 안전한 범위로 제한한다',()=>{
    const options=normalizeWaterButtonOptions({label:'SAVE WATER',waterLevel:2,waveStrength:8,disabled:true});
    expect(options.label).toBe('SAVE WATER');
    expect(options.waterLevel).toBe(.9);
    expect(options.waveStrength).toBe(3);
    expect(options.disabled).toBe(true);
  });
});
